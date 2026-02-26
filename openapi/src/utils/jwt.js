import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// ============================================
// JWT Utility Functions
// ============================================

/**
 * Generate Access Token
 * @param {Object} payload - Token payload (userId, email, roles, etc.)
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  const tokenPayload = {
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    roles: payload.roles || [],
    permissions: payload.permissions || [],
    type: 'access',
  };

  return jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

/**
 * Generate Refresh Token
 * @param {Object} payload - Token payload (userId)
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const tokenPayload = {
    userId: payload.userId,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} { accessToken, refreshToken }
 */
export const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles || [],
    permissions: user.permissions || [],
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.id });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
  };
};

/**
 * Verify Access Token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Access token expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid access token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Refresh token expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid refresh token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Get token expiry time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiry date or null
 */
export const getTokenExpiry = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
  try {
    const expiry = getTokenExpiry(token);
    if (!expiry) return true;

    return expiry < new Date();
  } catch {
    return true;
  }
};

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @param {string} email - Email address
 * @returns {string} Verification token
 */
export const generateEmailVerificationToken = (userId, email) => {
  return jwt.sign(
    {
      userId,
      email,
      type: 'email_verification',
    },
    config.jwt.secret,
    {
      expiresIn: '24h',
      issuer: config.jwt.issuer,
    }
  );
};

/**
 * Verify email verification token
 * @param {string} token - Verification token
 * @returns {Object} Decoded payload
 */
export const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    });

    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired verification token');
  }
};

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @returns {string} Reset token
 */
export const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: 'password_reset',
    },
    config.jwt.secret,
    {
      expiresIn: '1h',
      issuer: config.jwt.issuer,
    }
  );
};

/**
 * Verify password reset token
 * @param {string} token - Reset token
 * @returns {Object} Decoded payload
 */
export const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    });

    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
  getTokenExpiry,
  isTokenExpired,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};
