import pool from "../../db/postgres.js";
import crypto from "crypto";

import { v4 as uuidv4 } from "uuid";

/**
 * Generate a unique key value in the format SH-id<UUID> (max 32 chars)
 * @returns {string}
 */
const generateKeyValue = () => {
    // Generate UUID, remove dashes to make it a continuous hex string
    // Limit to 27 chars + 5 chars for "SH-id" = 32 chars total
    const uuidStr = uuidv4().replace(/-/g, "").substring(0, 27);
    return `SH-id${uuidStr}`;
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
 * Validate a license key and optionally bind an HWID
 * @param {Object} data - { keyValue, scriptId, hwid }
 * @returns {Object} { valid, key, message }
 */
export const validateKey = async ({ keyValue, scriptId, hwid }) => {
    const client = await pool.connect();

    try {
        // 1. Look up the key
        const keyResult = await client.query(
            `SELECT lk.*, s.title as script_title
             FROM license_keys lk
             JOIN scripts s ON lk.script_id = s.id
             WHERE lk.key_value = $1`,
            [keyValue]
        );

        if (keyResult.rows.length === 0) {
            return { valid: false, message: "Invalid key. Key does not exist." };
        }

        const key = keyResult.rows[0];

        // 2. Check if key belongs to the correct script
        if (scriptId && key.script_id !== scriptId) {
            return { valid: false, message: "Key does not belong to this script." };
        }

        // 3. Check key status
        if (key.status === "revoked") {
            return { valid: false, message: "Key has been revoked by the owner." };
        }
        if (key.status === "expired") {
            return { valid: false, message: "Key has expired." };
        }

        // 4. Check expiry for timed keys
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
            // Mark as expired
            await client.query(
                `UPDATE license_keys SET status = 'expired' WHERE id = $1`,
                [key.id]
            );
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
    } finally {
        client.release();
    }
};



