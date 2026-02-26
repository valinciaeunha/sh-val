import pool from "../../db/postgres.js";
import crypto from "crypto";

/**
 * Generate a unique key value in the format SH-idXXXXXXXXXXXXXXXXXXXXXX
 * @returns {string}
 */
const generateKeyValue = () => {
    const random = crypto.randomBytes(12).toString("hex"); // 24 hex chars
    return `SH-id${random}`;
};

/**
 * Generate multiple license keys
 * @param {Object} data - { scriptId, ownerId, type, maxDevices, expiresAt, note, quantity }
 * @returns {Array} Created keys
 */
export const generateKeys = async (data) => {
    const { scriptId, ownerId, type, maxDevices, expiresAt, note, quantity } = data;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const keys = [];
        for (let i = 0; i < quantity; i++) {
            const keyValue = generateKeyValue();
            const result = await client.query(
                `INSERT INTO license_keys (key_value, script_id, owner_id, type, status, max_devices, expires_at, note)
                 VALUES ($1, $2, $3, $4, 'unused', $5, $6, $7)
                 RETURNING *`,
                [keyValue, scriptId, ownerId, type, maxDevices, expiresAt || null, note || null]
            );
            keys.push(result.rows[0]);
        }

        await client.query("COMMIT");
        return keys;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get keys owned by user with pagination
 * @param {string} ownerId
 * @param {Object} options - { page, limit, status, scriptId }
 * @returns {Object} { keys, total, page, totalPages }
 */
export const getMyKeys = async (ownerId, options = {}) => {
    // Auto-expire keys first before fetching
    await pool.query(
        `UPDATE license_keys 
         SET status = 'expired', updated_at = NOW() 
         WHERE owner_id = $1 AND expires_at < NOW() AND status IN ('active', 'unused')`,
        [ownerId]
    );

    const { page = 1, limit = 20, status, scriptId } = options;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE lk.owner_id = $1";
    const values = [ownerId];
    let paramIndex = 2;

    if (status) {
        whereClause += ` AND lk.status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
    }
    if (scriptId) {
        whereClause += ` AND lk.script_id = $${paramIndex}`;
        values.push(scriptId);
        paramIndex++;
    }

    // Count total
    const countResult = await pool.query(
        `SELECT COUNT(*)::int as total FROM license_keys lk ${whereClause}`,
        values
    );
    const total = countResult.rows[0].total;

    // Get keys with script name and device count
    const keysResult = await pool.query(
        `SELECT lk.*, s.title as script_name,
            (SELECT COUNT(*)::int FROM key_devices kd WHERE kd.key_id = lk.id) as devices_used
         FROM license_keys lk
         JOIN scripts s ON lk.script_id = s.id
         ${whereClause}
         ORDER BY lk.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
    );

    return {
        keys: keysResult.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get key analytics/stats for a user
 * @param {string} ownerId
 * @returns {Object} Stats
 */
export const getKeyStats = async (ownerId) => {
    // Auto-expire keys first before calculating stats
    await pool.query(
        `UPDATE license_keys 
         SET status = 'expired', updated_at = NOW() 
         WHERE owner_id = $1 AND expires_at < NOW() AND status IN ('active', 'unused')`,
        [ownerId]
    );

    const result = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE status = 'active')::int as total_active,
            COUNT(*) FILTER (WHERE status = 'expired')::int as total_expired,
            COUNT(*) FILTER (WHERE status = 'revoked')::int as total_revoked,
            COUNT(*) FILTER (WHERE status = 'unused')::int as total_unused,
            (SELECT COUNT(*)::int FROM key_devices kd
             JOIN license_keys lk2 ON kd.key_id = lk2.id
             WHERE lk2.owner_id = $1) as total_devices
         FROM license_keys
         WHERE owner_id = $1`,
        [ownerId]
    );
    return result.rows[0];
};

/**
 * Get a single key by ID with its devices
 * @param {string} keyId
 * @returns {Object} Key with devices
 */
export const getKeyById = async (keyId) => {
    // Auto expire before fetching single key
    await pool.query(
        `UPDATE license_keys 
         SET status = 'expired', updated_at = NOW() 
         WHERE id = $1 AND expires_at < NOW() AND status IN ('active', 'unused')`,
        [keyId]
    );

    const keyResult = await pool.query(
        `SELECT lk.*, s.title as script_name
         FROM license_keys lk
         JOIN scripts s ON lk.script_id = s.id
         WHERE lk.id = $1`,
        [keyId]
    );
    if (keyResult.rows.length === 0) return null;

    const devicesResult = await pool.query(
        `SELECT * FROM key_devices WHERE key_id = $1 ORDER BY last_seen_at DESC`,
        [keyId]
    );

    return {
        ...keyResult.rows[0],
        devices: devicesResult.rows,
    };
};

/**
 * Revoke a key
 * @param {string} keyId
 * @param {string} ownerId
 * @returns {Object} Updated key
 */
export const revokeKey = async (keyId, ownerId) => {
    const result = await pool.query(
        `UPDATE license_keys SET status = 'revoked' WHERE id = $1 AND owner_id = $2 RETURNING *`,
        [keyId, ownerId]
    );
    return result.rows[0];
};

/**
 * Delete a key
 * @param {string} keyId
 * @param {string} ownerId
 * @returns {boolean}
 */
export const deleteKey = async (keyId, ownerId) => {
    const result = await pool.query(
        `DELETE FROM license_keys WHERE id = $1 AND owner_id = $2`,
        [keyId, ownerId]
    );
    return result.rowCount > 0;
};

/**
 * Revoke (remove) a device from a key
 * @param {string} deviceId
 * @param {string} ownerId - to verify ownership
 * @returns {boolean}
 */
export const revokeDevice = async (deviceId, ownerId) => {
    const result = await pool.query(
        `DELETE FROM key_devices kd
         USING license_keys lk
         WHERE kd.id = $1 AND kd.key_id = lk.id AND lk.owner_id = $2`,
        [deviceId, ownerId]
    );
    return result.rowCount > 0;
};

/**
 * Get user's key settings (create defaults if not found)
 * @param {string} userId
 * @returns {Object}
 */
export const getSettings = async (userId) => {
    let result = await pool.query(
        `SELECT * FROM key_settings WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        result = await pool.query(
            `INSERT INTO key_settings (user_id) VALUES ($1) RETURNING *`,
            [userId]
        );
    }

    return result.rows[0];
};

/**
 * Update user's key settings
 * @param {string} userId
 * @param {Object} settings
 * @returns {Object}
 */
export const updateSettings = async (userId, settings) => {
    const { deviceLockEnabled, maxDevicesPerKey, rateLimitingEnabled, autoExpireEnabled, hwidBlacklistEnabled } = settings;

    // Upsert
    const result = await pool.query(
        `INSERT INTO key_settings (user_id, device_lock_enabled, max_devices_per_key, rate_limiting_enabled, auto_expire_enabled, hwid_blacklist_enabled)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
            device_lock_enabled = EXCLUDED.device_lock_enabled,
            max_devices_per_key = EXCLUDED.max_devices_per_key,
            rate_limiting_enabled = EXCLUDED.rate_limiting_enabled,
            auto_expire_enabled = EXCLUDED.auto_expire_enabled,
            hwid_blacklist_enabled = EXCLUDED.hwid_blacklist_enabled
         RETURNING *`,
        [userId, deviceLockEnabled, maxDevicesPerKey, rateLimitingEnabled, autoExpireEnabled, hwidBlacklistEnabled]
    );

    return result.rows[0];
};

/**
 * Get user's scripts for the generate modal dropdown
 * @param {string} ownerId
 * @returns {Array}
 */
export const getUserScripts = async (ownerId) => {
    const result = await pool.query(
        `SELECT id, title FROM scripts WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY title ASC`,
        [ownerId]
    );
    return result.rows;
};


