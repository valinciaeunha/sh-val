import pool from "../../db/postgres.js";
import logger from "../../utils/logger.js";

/**
 * Get user's Get Key system settings
 * @param {string} userId
 * @returns {Object}
 */
export const getGetkeySettings = async (userId) => {
    // Use the existing getSettings logic to ensure defaults exist
    let result = await pool.query(
        `SELECT getkey_enabled, checkpoint_count, ad_links, checkpoint_timer_seconds,
                captcha_enabled, key_duration_hours, max_keys_per_ip, cooldown_hours
         FROM key_settings WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        // Create default settings row if not found
        await pool.query(
            `INSERT INTO key_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );
        result = await pool.query(
            `SELECT getkey_enabled, checkpoint_count, ad_links, checkpoint_timer_seconds,
                    captcha_enabled, key_duration_hours, max_keys_per_ip, cooldown_hours
             FROM key_settings WHERE user_id = $1`,
            [userId]
        );
    }

    return result.rows[0];
};

/**
 * Update user's Get Key system settings
 * @param {string} userId
 * @param {Object} data
 * @returns {Object}
 */
export const updateGetkeySettings = async (userId, data) => {
    const {
        getkeyEnabled,
        checkpointCount,
        adLinks,
        checkpointTimerSeconds,
        captchaEnabled,
        keyDurationHours,
        maxKeysPerIp,
        cooldownHours,
    } = data;

    // Ensure settings row exists
    await pool.query(
        `INSERT INTO key_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
        [userId]
    );

    const result = await pool.query(
        `UPDATE key_settings SET
            getkey_enabled = COALESCE($1, getkey_enabled),
            checkpoint_count = COALESCE($2, checkpoint_count),
            ad_links = COALESCE($3, ad_links),
            checkpoint_timer_seconds = COALESCE($4, checkpoint_timer_seconds),
            captcha_enabled = COALESCE($5, captcha_enabled),
            key_duration_hours = COALESCE($6, key_duration_hours),
            max_keys_per_ip = COALESCE($7, max_keys_per_ip),
            cooldown_hours = COALESCE($8, cooldown_hours),
            updated_at = NOW()
         WHERE user_id = $9
         RETURNING getkey_enabled, checkpoint_count, ad_links, checkpoint_timer_seconds,
                   captcha_enabled, key_duration_hours, max_keys_per_ip, cooldown_hours`,
        [
            getkeyEnabled,
            checkpointCount,
            adLinks,
            checkpointTimerSeconds,
            captchaEnabled,
            keyDurationHours,
            maxKeysPerIp,
            cooldownHours,
            userId,
        ]
    );

    logger.info(`User ${userId} updated Get Key settings`);
    return result.rows[0];
};
