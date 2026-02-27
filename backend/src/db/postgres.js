import pg from 'pg';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

// ============================================
// PostgreSQL Connection Pool
// ============================================
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  ssl: config.database.ssl,
});

// ============================================
// Connection Event Handlers
// ============================================
pool.on('connect', () => {
  if (config.isDevelopment) {
    logger.debug('PostgreSQL: New connection established');
  }
});

pool.on('error', (err) => {
  logger.error('PostgreSQL: Unexpected error on idle client: %o', err);
  // Don't exit — let the pool recover on its own
});

pool.on('remove', () => {
  if (config.isDevelopment) {
    logger.debug('PostgreSQL: Connection removed from pool');
  }
});

// ============================================
// Query Helper Function
// ============================================
export const query = async (text, params) => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (config.isDevelopment) {
      logger.debug('Query executed: %o', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    logger.error('Query error: %o', error);
    throw error;
  }
};

// ============================================
// Transaction Helper
// ============================================
export const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ============================================
// Get Client (for manual transaction control)
// ============================================
export const getClient = async () => {
  return await pool.connect();
};

// ============================================
// Health Check
// ============================================
export const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    return {
      status: 'connected',
      timestamp: result.rows[0].current_time,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount,
    };
  } catch (error) {
    logger.error('PostgreSQL health check failed: %o', error);
    return {
      status: 'disconnected',
      error: error.message,
    };
  }
};

// ============================================
// Graceful Shutdown
// ============================================
export const closePool = async () => {
  logger.info('Closing PostgreSQL connection pool...');
  await pool.end();
  logger.info('PostgreSQL connection pool closed');
};

// ============================================
// Test Connection on Import (with retry)
// ============================================
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await pool.connect();
      logger.info(`PostgreSQL: Connection pool initialized (${config.database.database} @ ${config.database.host}:${config.database.port})`);
      client.release();
      return; // success
    } catch (error) {
      logger.error(`PostgreSQL: Connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        logger.info(`PostgreSQL: Retrying in ${RETRY_DELAY / 1000}s...`);
        await sleep(RETRY_DELAY);
      } else {
        logger.error('PostgreSQL: All connection attempts failed. The app will continue but DB queries will fail.');
      }
    }
  }
})();

export default pool;
