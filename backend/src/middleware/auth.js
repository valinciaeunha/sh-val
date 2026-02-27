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

export default {
  authenticate,
  optionalAuth,
  isAuthenticated,
};
