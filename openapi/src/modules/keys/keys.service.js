import pool from "../../db/postgres.js";

/**
 * Validate a license key and optionally bind an HWID
 * @param {Object} data - { keyValue, scriptId, hwid }
 * @returns {Object} { valid, key, message }
 */
export const validateKey = async ({ keyValue, scriptId, hwid }) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Look up the key
        const keyResult = await client.query(
            `SELECT lk.*, s.title as script_title
             FROM license_keys lk
             JOIN scripts s ON lk.script_id = s.id
             WHERE lk.key_value = $1`,
            [keyValue]
        );

        if (keyResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return { valid: false, message: "Invalid key. Key does not exist." };
        }

        const key = keyResult.rows[0];

        // 2. Check if key belongs to the correct script
        if (scriptId && key.script_id !== scriptId) {
            await client.query("ROLLBACK");
            return { valid: false, message: "Key does not belong to this script." };
        }

        // 3. Check key status
        if (key.status === "revoked") {
            await client.query("ROLLBACK");
            return { valid: false, message: "Key has been revoked by the owner." };
        }
        if (key.status === "expired") {
            await client.query("ROLLBACK");
            return { valid: false, message: "Key has expired." };
        }

        // 4. Check expiry for timed keys
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
            // Mark as expired
            await client.query(
                `UPDATE license_keys SET status = 'expired' WHERE id = $1`,
                [key.id]
            );
            await client.query("COMMIT");
            return { valid: false, message: "Key has expired." };
        }

        // 5. Handle HWID device binding
        if (hwid) {
            // Get current devices for this key
            const devicesResult = await client.query(
                `SELECT * FROM key_devices WHERE key_id = $1`,
                [key.id]
            );
            const devices = devicesResult.rows;
            const existingDevice = devices.find(d => d.hwid === hwid);

            if (existingDevice) {
                // Device already registered — update last_seen
                await client.query(
                    `UPDATE key_devices SET last_seen_at = NOW() WHERE id = $1`,
                    [existingDevice.id]
                );
            } else {
                // New device — check max_devices limit
                if (devices.length >= key.max_devices) {
                    await client.query("ROLLBACK");
                    return {
                        valid: false,
                        message: `Device limit reached (${key.max_devices}). This key is already bound to ${devices.length} device(s).`,
                    };
                }
                // Register new device
                await client.query(
                    `INSERT INTO key_devices (key_id, hwid) VALUES ($1, $2)`,
                    [key.id, hwid]
                );
            }
        }

        // 6. Activate key if unused
        if (key.status === "unused") {
            await client.query(
                `UPDATE license_keys SET status = 'active', last_activity_at = NOW() WHERE id = $1`,
                [key.id]
            );
        } else {
            await client.query(
                `UPDATE license_keys SET last_activity_at = NOW() WHERE id = $1`,
                [key.id]
            );
        }

        await client.query("COMMIT");

        return {
            valid: true,
            message: "Key is valid.",
            key: {
                id: key.id,
                type: key.type,
                status: key.status === "unused" ? "active" : key.status,
                max_devices: key.max_devices,
                expires_at: key.expires_at,
                script_title: key.script_title,
            },
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
