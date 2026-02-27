import { createClient } from 'redis';
import config from '../config/index.js';

// ============================================
// Redis Client Configuration
// ============================================
const redisClient = createClient({
  url: config.redis.url || `redis://${config.redis.host}:${config.redis.port}`,
  password: config.redis.password,
  database: config.redis.db,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
});

// ============================================
// Event Handlers
// ============================================
redisClient.on('connect', () => {
  console.log('🔌 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connection established and ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis: Error occurred', err);
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('🔌 Redis: Connection closed');
});

// ============================================
// Connect to Redis
// ============================================
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis: Client initialized successfully');
  } catch (error) {
    console.error('❌ Redis: Failed to connect');
    console.error('Error:', error.message);
    if (config.isProduction) {
      process.exit(1);
    }
  }
})();

// ============================================
// Helper Functions
// ============================================

/**
 * Set value with optional expiry
 * @param {string} key - Redis key
 * @param {any} value - Value to store (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (optional)
 */
export const setCache = async (key, value, ttl = null) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await redisClient.setEx(key, ttl, stringValue);
    } else {
      await redisClient.set(key, stringValue);
    }

    if (config.isDevelopment) {
      console.log(`💾 Redis: SET ${key} (TTL: ${ttl || 'none'})`);
    }

    return true;
  } catch (error) {
    console.error('❌ Redis SET error:', error);
    throw error;
  }
};

/**
 * Get value from cache
 * @param {string} key - Redis key
 * @param {boolean} parse - Parse JSON automatically (default: true)
 */
export const getCache = async (key, parse = true) => {
  try {
    const value = await redisClient.get(key);

    if (config.isDevelopment) {
      console.log(`🔍 Redis: GET ${key} - ${value ? 'HIT' : 'MISS'}`);
    }

    if (!value) return null;

    if (parse) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  } catch (error) {
    console.error('❌ Redis GET error:', error);
    throw error;
  }
};

/**
 * Delete key from cache
 * @param {string} key - Redis key
 */
export const deleteCache = async (key) => {
  try {
    const result = await redisClient.del(key);

    if (config.isDevelopment) {
      console.log(`🗑️ Redis: DEL ${key} - ${result ? 'SUCCESS' : 'NOT FOUND'}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Redis DEL error:', error);
    throw error;
  }
};

/**
 * Delete keys by pattern
 * @param {string} pattern - Pattern to match (e.g., 'user:*')
 */
export const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    const result = await redisClient.del(keys);

    if (config.isDevelopment) {
      console.log(`🗑️ Redis: DEL pattern ${pattern} - ${result} keys deleted`);
    }

    return result;
  } catch (error) {
    console.error('❌ Redis DEL pattern error:', error);
    throw error;
  }
};

/**
 * Check if key exists
 * @param {string} key - Redis key
 */
export const existsCache = async (key) => {
  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('❌ Redis EXISTS error:', error);
    throw error;
  }
};

/**
 * Increment value
 * @param {string} key - Redis key
 */
export const incrementCache = async (key) => {
  try {
    const result = await redisClient.incr(key);
    return result;
  } catch (error) {
    console.error('❌ Redis INCR error:', error);
    throw error;
  }
};

/**
 * Set expiry on existing key
 * @param {string} key - Redis key
 * @param {number} ttl - Time to live in seconds
 */
export const expireCache = async (key, ttl) => {
  try {
    const result = await redisClient.expire(key, ttl);
    return result;
  } catch (error) {
    console.error('❌ Redis EXPIRE error:', error);
    throw error;
  }
};

/**
 * Get remaining TTL
 * @param {string} key - Redis key
 */
export const getTTL = async (key) => {
  try {
    const ttl = await redisClient.ttl(key);
    return ttl;
  } catch (error) {
    console.error('❌ Redis TTL error:', error);
    throw error;
  }
};

// ============================================
// Session Management Helpers
// ============================================

/**
 * Store session/refresh token
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 * @param {number} expiresIn - Expiry in seconds
 */
export const storeRefreshToken = async (userId, token, expiresIn) => {
  const key = `session:${userId}:${token}`;
  await setCache(key, { userId, token, createdAt: new Date().toISOString() }, expiresIn);
};

/**
 * Validate refresh token
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 */
export const validateRefreshToken = async (userId, token) => {
  const key = `session:${userId}:${token}`;
  const exists = await existsCache(key);
  return exists;
};

/**
 * Revoke refresh token
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 */
export const revokeRefreshToken = async (userId, token) => {
  const key = `session:${userId}:${token}`;
  await deleteCache(key);
};

/**
 * Revoke all user sessions
 * @param {string} userId - User ID
 */
export const revokeAllUserSessions = async (userId) => {
  const pattern = `session:${userId}:*`;
  await deleteCachePattern(pattern);
};

// ============================================
// Permission Caching
// ============================================

/**
 * Cache user permissions
 * @param {string} userId - User ID
 * @param {Array} permissions - Array of permission names
 */
export const cacheUserPermissions = async (userId, permissions) => {
  const key = `permissions:${userId}`;
  await setCache(key, permissions, 900); // 15 minutes
};

/**
 * Get cached user permissions
 * @param {string} userId - User ID
 */
export const getCachedUserPermissions = async (userId) => {
  const key = `permissions:${userId}`;
  return await getCache(key);
};

/**
 * Invalidate user permissions cache
 * @param {string} userId - User ID
 */
export const invalidateUserPermissions = async (userId) => {
  const key = `permissions:${userId}`;
  await deleteCache(key);
};

// ============================================
// Rate Limiting Helpers
// ============================================

/**
 * Check and increment rate limit
 * @param {string} identifier - IP or user ID
 * @param {number} limit - Max requests
 * @param {number} windowSeconds - Time window in seconds
 */
export const checkRateLimit = async (identifier, limit, windowSeconds) => {
  const key = `ratelimit:${identifier}`;
  const current = await redisClient.incr(key);

  if (current === 1) {
    await redisClient.expire(key, windowSeconds);
  }

  return {
    current,
    limit,
    remaining: Math.max(0, limit - current),
    exceeded: current > limit,
  };
};

// ============================================
// Health Check
// ============================================
export const healthCheck = async () => {
  try {
    const pingResult = await redisClient.ping();
    const info = await redisClient.info('server');

    return {
      status: 'connected',
      ping: pingResult,
      info: info.split('\r\n').slice(0, 5).join(', '),
    };
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    return {
      status: 'disconnected',
      error: error.message,
    };
  }
};

// ============================================
// Graceful Shutdown
// ============================================
export const closeRedis = async () => {
  console.log('🔌 Closing Redis connection...');
  await redisClient.quit();
  console.log('✅ Redis connection closed');
};

export default redisClient;
