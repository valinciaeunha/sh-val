import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../db/postgres.js';
import {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
} from '../../utils/jwt.js';
import {
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
} from '../../db/redis.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

// ============================================
// Auth Service
// ============================================

/**
 * Register new user with email and password
 */
export const registerUser = async (userData) => {
  const { username, email, password, displayName } = userData;

  try {
    return await transaction(async (client) => {
      // Check if username already exists
      const usernameCheck = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (usernameCheck.rows.length > 0) {
        throw {
          statusCode: 409,
          message: 'Username already taken',
          field: 'username',
        };
      }

      // Check if email already exists
      if (email) {
        const emailCheck = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (emailCheck.rows.length > 0) {
          throw {
            statusCode: 409,
            message: 'Email already registered',
            field: 'email',
          };
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(
        password,
        config.security.bcryptRounds
      );

      // Create user
      const userId = uuidv4();
      const userResult = await client.query(
        `
        INSERT INTO users (
          id, username, email, password_hash, display_name, account_status
        ) VALUES ($1, $2, $3, $4, $5, 'active')
        RETURNING id, username, email, display_name, created_at
        `,
        [userId, username, email || null, passwordHash, displayName || username]
      );

      const user = userResult.rows[0];

      // Assign default "user" role
      const roleResult = await client.query(
        "SELECT id FROM roles WHERE name = 'user'"
      );

      if (roleResult.rows.length > 0) {
        await client.query(
          `
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
          `,
          [userId, roleResult.rows[0].id]
        );
      }

      // Create auth provider entry
      await client.query(
        `
        INSERT INTO auth_providers (
          id, user_id, provider, provider_user_id
        ) VALUES ($1, $2, 'email', $3)
        `,
        [uuidv4(), userId, userId]
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          createdAt: user.created_at,
        },
      };
    });
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Registration error:', error);
    throw {
      statusCode: 500,
      message: 'Failed to register user',
    };
  }
};

/**
 * Login user with email/username and password
 */
export const loginUser = async (identifier, password) => {
  try {
    // Find user by username or email
    const userResult = await query(
      `
      SELECT
        u.id, u.username, u.email, u.password_hash, u.display_name,
        u.avatar_url, u.account_status, u.email_verified
      FROM users u
      WHERE u.username = $1 OR u.email = $1
      `,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      throw {
        statusCode: 401,
        message: 'Invalid credentials',
      };
    }

    const user = userResult.rows[0];

    // Check account status
    if (user.account_status !== 'active') {
      throw {
        statusCode: 403,
        message: `Account is ${user.account_status}`,
      };
    }

    // Verify password
    if (!user.password_hash) {
      throw {
        statusCode: 401,
        message: 'Please login with your social account',
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw {
        statusCode: 401,
        message: 'Invalid credentials',
      };
    }

    // Load user roles and permissions
    const rolesResult = await query(
      `
      SELECT DISTINCT r.name
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      `,
      [user.id]
    );

    const permissionsResult = await query(
      `
      SELECT DISTINCT p.name
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
      `,
      [user.id]
    );

    const roles = rolesResult.rows.map((row) => row.name);
    const permissions = permissionsResult.rows.map((row) => row.name);

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions,
    });

    // Store refresh token in Redis (30 days expiry)
    await storeRefreshToken(user.id, tokens.refreshToken, 30 * 24 * 60 * 60);

    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        roles,
        permissions,
      },
      tokens,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Login error:', error);
    throw {
      statusCode: 500,
      message: 'Failed to login',
    };
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Validate refresh token in Redis
    const isValid = await validateRefreshToken(decoded.userId, refreshToken);

    if (!isValid) {
      throw {
        statusCode: 401,
        message: 'Invalid or revoked refresh token',
      };
    }

    // Get user data
    const userResult = await query(
      `
      SELECT
        u.id, u.username, u.email, u.display_name, u.account_status
      FROM users u
      WHERE u.id = $1
      `,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    const user = userResult.rows[0];

    if (user.account_status !== 'active') {
      throw {
        statusCode: 403,
        message: `Account is ${user.account_status}`,
      };
    }

    // Load roles and permissions
    const rolesResult = await query(
      `
      SELECT DISTINCT r.name
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      `,
      [user.id]
    );

    const permissionsResult = await query(
      `
      SELECT DISTINCT p.name
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
      `,
      [user.id]
    );

    const roles = rolesResult.rows.map((row) => row.name);
    const permissions = permissionsResult.rows.map((row) => row.name);

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions,
    });

    return {
      accessToken,
      expiresIn: config.jwt.expiresIn,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.name === 'TokenExpiredError') {
      throw {
        statusCode: 401,
        message: 'Refresh token expired',
      };
    }
    logger.error('Refresh token error:', error);
    throw {
      statusCode: 401,
      message: 'Invalid refresh token',
    };
  }
};

/**
 * Logout user (revoke refresh token)
 */
export const logoutUser = async (userId, refreshToken) => {
  try {
    await revokeRefreshToken(userId, refreshToken);
    return { success: true };
  } catch (error) {
    logger.error('Logout error:', error);
    throw {
      statusCode: 500,
      message: 'Failed to logout',
    };
  }
};

/**
 * Logout from all devices
 */
export const logoutAllDevices = async (userId) => {
  try {
    await revokeAllUserSessions(userId);
    return { success: true };
  } catch (error) {
    logger.error('Logout all error:', error);
    throw {
      statusCode: 500,
      message: 'Failed to logout from all devices',
    };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  try {
    const result = await query(
      `
      SELECT
        id, username, email, display_name, avatar_url,
        bio, account_status, email_verified, created_at, updated_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    const user = result.rows[0];

    // Load roles
    const rolesResult = await query(
      `
      SELECT DISTINCT r.name
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      `,
      [userId]
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      accountStatus: user.account_status,
      emailVerified: user.email_verified,
      roles: rolesResult.rows.map((row) => row.name),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Get user error:', error);
    throw {
      statusCode: 500,
      message: 'Failed to fetch user',
    };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const allowedFields = ['display_name', 'bio', 'avatar_url'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw {
        statusCode: 400,
        message: 'No valid fields to update',
      };
    }

    values.push(userId);

    const result = await query(
      `
      UPDATE users
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, username, email, display_name, avatar_url, bio, updated_at
      `,
      values
    );

    if (result.rows.length === 0) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    const user = result.rows[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      updatedAt: user.updated_at,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Update profile error:', error);
    throw {
      statusCode: 500,
      message: 'Failed to update profile',
    };
  }
};

/**
 * Change user password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      throw {
        statusCode: 400,
        message: 'Cannot change password for social login accounts',
      };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      throw {
        statusCode: 401,
        message: 'Current password is incorrect',
      };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(
      newPassword,
      config.security.bcryptRounds
    );

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Revoke all sessions except current
    await revokeAllUserSessions(userId);

    return { success: true };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Change password error:', error);
    throw {
      statusCode: 500,
      message: 'Failed to change password',
    };
  }
};

export default {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  getUserById,
  updateUserProfile,
  changePassword,
};
