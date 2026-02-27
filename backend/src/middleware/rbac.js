import { getCachedUserPermissions, cacheUserPermissions } from '../db/redis.js';
import { query } from '../db/postgres.js';
import logger from '../utils/logger.js';

// ============================================
// RBAC Middleware - Role-Based Access Control
// ============================================

/**
 * Load user permissions from cache or database
 * @param {string} userId - User ID
 * @returns {Array} Array of permission names
 */
export const loadUserPermissions = async (userId) => {
  try {
    // Try to get from cache first
    let permissions = await getCachedUserPermissions(userId);

    if (permissions) {
      return permissions;
    }

    // If not in cache, load from database
    const result = await query(
      `
      SELECT DISTINCT p.name
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY p.name
      `,
      [userId]
    );

    permissions = result.rows.map((row) => row.name);

    // Cache for 15 minutes
    await cacheUserPermissions(userId, permissions);

    return permissions;
  } catch (error) {
    logger.error('Error loading user permissions: %o', error);
    return [];
  }
};

/**
 * Load user roles from database
 * @param {string} userId - User ID
 * @returns {Array} Array of role names
 */
export const loadUserRoles = async (userId) => {
  try {
    const result = await query(
      `
      SELECT DISTINCT r.name
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.name
      `,
      [userId]
    );

    return result.rows.map((row) => row.name);
  } catch (error) {
    logger.error('Error loading user roles: %o', error);
    return [];
  }
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission name (e.g., 'scripts.create')
 */
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // User must be authenticated first
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Load user permissions if not already loaded
      if (!req.user.permissions || req.user.permissions.length === 0) {
        req.user.permissions = await loadUserPermissions(req.user.userId);
      }

      // Check if user has the required permission
      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have permission to perform this action`,
          required: permission,
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error: %o', error);
      return res.status(500).json({
        error: 'InternalError',
        message: 'Failed to verify permissions',
      });
    }
  };
};

/**
 * Check if user has ANY of the specified permissions
 * @param {Array} permissions - Array of permission names
 */
export const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      if (!req.user.permissions || req.user.permissions.length === 0) {
        req.user.permissions = await loadUserPermissions(req.user.userId);
      }

      // Check if user has at least one of the required permissions
      const hasPermission = permissions.some((perm) =>
        req.user.permissions.includes(perm)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have any of the required permissions`,
          required: permissions,
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        error: 'InternalError',
        message: 'Failed to verify permissions',
      });
    }
  };
};

/**
 * Check if user has ALL of the specified permissions
 * @param {Array} permissions - Array of permission names
 */
export const checkAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      if (!req.user.permissions || req.user.permissions.length === 0) {
        req.user.permissions = await loadUserPermissions(req.user.userId);
      }

      // Check if user has all required permissions
      const hasAllPermissions = permissions.every((perm) =>
        req.user.permissions.includes(perm)
      );

      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter(
          (perm) => !req.user.permissions.includes(perm)
        );

        return res.status(403).json({
          error: 'Forbidden',
          message: `You're missing required permissions`,
          required: permissions,
          missing: missingPermissions,
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        error: 'InternalError',
        message: 'Failed to verify permissions',
      });
    }
  };
};

/**
 * Check if user has specific role
 * @param {string} role - Role name (e.g., 'admin')
 */
export const checkRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Load user roles if not already loaded
      if (!req.user.roles || req.user.roles.length === 0) {
        req.user.roles = await loadUserRoles(req.user.userId);
      }

      // Check if user has the required role
      if (!req.user.roles.includes(role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This action requires ${role} role`,
          required: role,
        });
      }

      next();
    } catch (error) {
      logger.error('Role check error: %o', error);
      return res.status(500).json({
        error: 'InternalError',
        message: 'Failed to verify role',
      });
    }
  };
};

/**
 * Check if user has ANY of the specified roles
 * @param {Array} roles - Array of role names
 */
export const checkAnyRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      if (!req.user.roles || req.user.roles.length === 0) {
        req.user.roles = await loadUserRoles(req.user.userId);
      }

      const hasRole = roles.some((role) => req.user.roles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This action requires one of these roles: ${roles.join(', ')}`,
          required: roles,
        });
      }

      next();
    } catch (error) {
      logger.error('Role check error: %o', error);
      return res.status(500).json({
        error: 'InternalError',
        message: 'Failed to verify roles',
      });
    }
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = checkRole('admin');

/**
 * Check if user is moderator or admin
 */
export const isModerator = checkAnyRole(['admin', 'moderator']);

/**
 * Check if user owns the resource
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 */
export const checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const ownerId = await getResourceOwnerId(req);

      // Check if user is the owner or is admin
      if (
        req.user.userId !== ownerId &&
        !req.user.roles.includes('admin')
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only modify your own resources',
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error: %o', error);
      return res.status(500).json({
        error: 'InternalError',
        message: 'Failed to verify ownership',
      });
    }
  };
};

export default {
  loadUserPermissions,
  loadUserRoles,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkRole,
  checkAnyRole,
  isAdmin,
  isModerator,
  checkOwnership,
};
