import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';

// ============================================
// Authentication Middleware
// ============================================

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Access token has expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'InvalidToken',
        message: 'Invalid access token',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    // If token is invalid, just set user to null
    req.user = null;
    next();
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
  }
  next();
};

/**
 * Authenticate using a Developer API Key
 * Validates the token against the user_key_settings table
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = extractTokenFromHeader(authHeader);

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No API key provided. Use format "Bearer <API_KEY>"',
      });
    }

    // Direct dependency on pool here; assuming pool is available or imported.
    // If not imported, we need to import it. Let's make sure it is imported at the top.
    const { default: pool } = await import('../db/postgres.js');

    const query = `
      SELECT id as user_id, username, email
      FROM users
      WHERE api_key = $1
    `;
    const result = await pool.query(query, [apiKey]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }

    // Attach user data to request
    const userRoleQuery = "SELECT r.name as role FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1";
    const roleResult = await pool.query(userRoleQuery, [result.rows[0].user_id]);
    const roles = roleResult.rows.map(r => r.role);

    req.user = {
      userId: result.rows[0].user_id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      roles: roles || [],
      permissions: [], // Keep simplified unless needed for API key operations
    };

    next();
  } catch (error) {
    console.error("API Key Auth Error:", error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to authenticate API key',
    });
  }
};

export default {
  authenticate,
  optionalAuth,
  isAuthenticated,
};

