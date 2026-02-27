import pool from "../../db/postgres.js";
import logger from "../../utils/logger.js";
import crypto from "crypto";

// Secret used to sign session tokens
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret-change-this';

/**
 * Generate a random key value (same format as keys.service.js)
 */
const generateKeyValue = () => {
    const random = crypto.randomBytes(12).toString("hex"); // 24 hex chars
    return `SH-id${random}`;
};

/**
 * Generate an HMAC signed token to prevent forgery
 */
const signToken = (payload) => {
    const data = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(data);
    const signature = hmac.digest('hex');
    return `${Buffer.from(data).toString('base64')}.${signature}`;
};

/**
 * Verify an HMAC signed token
 */
const verifyToken = (tokenString) => {
    try {
        const [b64Data, signature] = tokenString.split('.');
        const data = Buffer.from(b64Data, 'base64').toString('utf8');

        const hmac = crypto.createHmac('sha256', SESSION_SECRET);
        hmac.update(data);
        const expectedSignature = hmac.digest('hex');

        if (signature !== expectedSignature) return null;
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
};

/**
 * Get script info + owner's getkey settings for the public getkey page
 * @param {string} slug - Script slug
 * @returns {Object|null}
 */
export const getPublicScriptInfo = async (slug) => {
    const result = await pool.query(
        `SELECT 
            s.id, s.title, s.slug, s.thumbnail_url, s.description,
            s.game_id, s.hub_id, s.owner_id,
            u.username as owner_username, u.display_name as owner_display_name, u.avatar_url as owner_avatar_url,
            h.name as hub_name, h.slug as hub_slug, h.logo_url as hub_logo_url,
            h.is_verified as hub_is_verified, h.is_official as hub_is_official,
            g.name as game_name, g.slug as game_slug, g.logo_url as game_logo_url, g.banner_url as game_banner_url,
            ks.getkey_enabled, ks.checkpoint_count, ks.ad_links,
            ks.checkpoint_timer_seconds, ks.captcha_enabled,
            ks.key_duration_hours, ks.max_keys_per_ip, ks.cooldown_hours
         FROM scripts s
         LEFT JOIN users u ON s.owner_id = u.id
         LEFT JOIN hubs h ON s.hub_id = h.id
         LEFT JOIN games g ON s.game_id = g.id
         LEFT JOIN key_settings ks ON s.owner_id = ks.user_id
         WHERE s.slug = $1
         AND s.status = 'published'
         AND s.deleted_at IS NULL`,
        [slug]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Check if getkey is enabled for this script's owner
    if (!row.getkey_enabled) return null;

    // Inject permanent default monetization link for the platform owner
    const DEFAULT_LINK = "https://omg10.com/4/9212698";
    row.ad_links = Array.isArray(row.ad_links) ? row.ad_links : [];

    if (!row.ad_links.includes(DEFAULT_LINK)) {
        row.ad_links.unshift(DEFAULT_LINK); // Make it the very first checkpoint
    }

    // Force at least 1 checkpoint to ensure the default link is always clicked
    row.checkpoint_count = Math.max(row.checkpoint_count || 1, 1);

    return row;
};

/**
 * Start a GetKey session
 */
export const startSession = async (scriptSlug, ipAddress, deviceId) => {
    // Asynchronously clean up all expired sessions to keep the database tidy
    pool.query(`DELETE FROM getkey_sessions WHERE expires_at < NOW()`).catch(e => logger.error("Session cleanup error:", e));

    const script = await getPublicScriptInfo(scriptSlug);
    if (!script) throw new Error("Script not found or Get Key not enabled");

    // Rate limit check for overall generation to prevent spamming sessions
    const rateCheck = await pool.query(
        `SELECT COUNT(*) as count FROM license_keys
         WHERE script_id = $1
         AND note = 'getkey:public'
         AND created_at > NOW() - INTERVAL '1 hour' * $2
         AND note LIKE $3`,
        [script.id, script.cooldown_hours || 24, `getkey:public:${ipAddress}%`]
    );

    const currentCount = parseInt(rateCheck.rows[0].count);
    if (currentCount >= (script.max_keys_per_ip || 1)) {
        throw new Error(`Rate limit exceeded. Try again in ${script.cooldown_hours || 24} hours.`);
    }

    // Determine checkpoints
    const requiredCheckpoints = Math.min(
        script.checkpoint_count || 2,
        script.ad_links?.length || 0
    );

    // Captcha is handled by Cloudflare Turnstile on the frontend now
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 mins to complete

    const token = signToken({ sessionId, scriptId: script.id, ipAddress, deviceId });

    await pool.query(
        `INSERT INTO getkey_sessions 
         (id, token, script_id, ip_address, checkpoints_required, captcha_required, captcha_answer, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sessionId, token, script.id, ipAddress, requiredCheckpoints, script.captcha_enabled, null, expiresAt]
    );

    return {
        token,
        script,
        checkpointsRequired: requiredCheckpoints,
        captchaEnabled: script.captcha_enabled
    };
};

/**
 * Complete a checkpoint
 */
export const completeCheckpoint = async (token, checkpointIndex, ipAddress, deviceId) => {
    const payload = verifyToken(token);
    if (!payload) throw new Error("Invalid session token");
    if (payload.deviceId && deviceId && payload.deviceId !== deviceId) {
        throw new Error("Browser mismatch. Looks like you copied this link from another browser.");
    }

    // Get session
    const result = await pool.query(
        `SELECT * FROM getkey_sessions WHERE id = $1 AND token = $2 AND status = 'pending'`,
        [payload.sessionId, token]
    );

    if (result.rows.length === 0) throw new Error("Session not found or already completed");
    const session = result.rows[0];

    if (session.ip_address !== ipAddress) throw new Error("IP mismatch for this session");
    if (new Date() > new Date(session.expires_at)) {
        await pool.query(`UPDATE getkey_sessions SET status = 'expired' WHERE id = $1`, [session.id]);
        throw new Error("Session expired");
    }

    // Validate checkpoint index
    const idx = parseInt(checkpointIndex);
    if (idx < 0 || idx >= session.checkpoints_required) throw new Error("Invalid checkpoint index");

    // Ensure order
    const completed = session.checkpoints_completed || [];
    if (completed.includes(idx)) return { success: true, message: "Already completed" };

    // Require previous checkpoint to be done
    if (idx > 0 && !completed.includes(idx - 1)) {
        throw new Error("Must complete previous checkpoints first");
    }

    // Get exact script info to check timer requirements
    const scriptRes = await pool.query(`SELECT user_id, checkpoint_timer_seconds FROM key_settings WHERE user_id = (SELECT owner_id FROM scripts WHERE id = $1)`, [session.script_id]);
    const timerSeconds = scriptRes.rows[0]?.checkpoint_timer_seconds || 10;

    // Wait time logic could be added here if we track 'last_checkpoint_time'
    // For now, updating the array
    const updatedCheckpoints = [...completed, idx];

    await pool.query(
        `UPDATE getkey_sessions SET checkpoints_completed = $1 WHERE id = $2`,
        [updatedCheckpoints, session.id]
    );

    return {
        success: true,
        completed: updatedCheckpoints.length,
        required: session.checkpoints_required
    };
};

/**
 * Verify Cloudflare Turnstile Captcha
 */
export const verifyCaptcha = async (token, turnstileToken, ipAddress, deviceId) => {
    const payload = verifyToken(token);
    if (!payload) throw new Error("Invalid session token");
    if (payload.deviceId && deviceId && payload.deviceId !== deviceId) {
        throw new Error("Browser mismatch. Looks like you copied this link from another browser.");
    }

    const result = await pool.query(
        `SELECT * FROM getkey_sessions WHERE id = $1 AND token = $2 AND status = 'pending'`,
        [payload.sessionId, token]
    );

    if (result.rows.length === 0) throw new Error("Session not found or already completed");
    const session = result.rows[0];

    if (session.ip_address !== ipAddress) throw new Error("IP mismatch");
    if (new Date() > new Date(session.expires_at)) throw new Error("Session expired");

    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
    if (!TURNSTILE_SECRET_KEY) {
        logger.error("TURNSTILE_SECRET_KEY is not defined.");
        throw new Error("Server configuration error: Turnstile Secret Key not set");
    }

    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", turnstileToken);
    formData.append("remoteip", ipAddress);

    try {
        const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
        });
        const cfJson = await cfRes.json();

        logger.info(`Turnstile verification response for IP ${ipAddress}:`, cfJson);

        if (!cfJson.success) {
            logger.error(`Turnstile verification failed. Error Codes: ${cfJson['error-codes']}`);
            throw new Error(`Captcha verification failed: Bot detected (${cfJson['error-codes']})`);
        }
    } catch (e) {
        logger.error(`Turnstile Fetch Exception: ${e.message}`, e);
        throw new Error(e.message || "Failed to contact Turnstile server");
    }

    await pool.query(`UPDATE getkey_sessions SET captcha_passed = true WHERE id = $1`, [session.id]);
    return { success: true };
};

/**
 * Get session info
 */
export const getSessionInfo = async (token, deviceId) => {
    const payload = verifyToken(token);
    if (!payload) throw new Error("Invalid session token");
    if (payload.deviceId && deviceId && payload.deviceId !== deviceId) {
        throw new Error("Browser mismatch. Looks like you copied this link from another browser.");
    }

    const result = await pool.query(
        `SELECT s.status, s.key_value, s.checkpoints_required, s.checkpoints_completed, s.captcha_required, s.captcha_passed,
         sc.slug as script_slug
         FROM getkey_sessions s
         JOIN scripts sc ON s.script_id = sc.id
         WHERE s.id = $1 AND s.token = $2`,
        [payload.sessionId, token]
    );

    if (result.rows.length === 0) throw new Error("Session not found");
    const session = result.rows[0];

    return {
        status: session.status,
        keyValue: session.key_value,
        checkpointsCompleted: session.checkpoints_completed?.length || 0,
        checkpointsRequired: session.checkpoints_required,
        captchaRequired: session.captcha_required,
        captchaPassed: session.captcha_passed,
        scriptSlug: session.script_slug
    };
};

/**
 * Generate a public key with session token verification
 */
export const generatePublicKey = async (token, ipAddress, deviceId) => {
    const payload = verifyToken(token);
    if (!payload) throw new Error("Invalid session token");
    if (payload.deviceId && deviceId && payload.deviceId !== deviceId) {
        throw new Error("Browser mismatch. Looks like you copied this link from another browser.");
    }

    const sessionRes = await pool.query(
        `SELECT * FROM getkey_sessions WHERE id = $1 AND token = $2`,
        [payload.sessionId, token]
    );

    if (sessionRes.rows.length === 0) throw new Error("Session not found");
    const session = sessionRes.rows[0];

    if (session.status === 'completed' && session.key_value) {
        // Already generated, just return it
        return { keyValue: session.key_value };
    }

    if (session.status !== 'pending') throw new Error(`Session is ${session.status}`);
    if (session.ip_address !== ipAddress) throw new Error("IP mismatch for this session");
    if (new Date() > new Date(session.expires_at)) {
        await pool.query(`UPDATE getkey_sessions SET status = 'expired' WHERE id = $1`, [session.id]);
        throw new Error("Session expired");
    }

    // Verify all checkpoints done
    const completedCount = session.checkpoints_completed ? session.checkpoints_completed.length : 0;
    if (completedCount < session.checkpoints_required) {
        throw new Error("Not all checkpoints have been completed");
    }

    // Verify captcha done
    if (session.captcha_required && !session.captcha_passed) {
        throw new Error("Captcha verification required");
    }

    // Get script + owner settings
    const scriptRes = await pool.query(`SELECT slug FROM scripts WHERE id = $1`, [session.script_id]);
    const script = await getPublicScriptInfo(scriptRes.rows[0].slug);
    if (!script) throw new Error("Script not found or Get Key not enabled");

    // Double check rate limit
    const rateCheck = await pool.query(
        `SELECT COUNT(*) as count FROM license_keys
         WHERE script_id = $1
         AND note = 'getkey:public'
         AND created_at > NOW() - INTERVAL '1 hour' * $2
         AND note LIKE $3`,
        [script.id, script.cooldown_hours || 24, `getkey:public:${ipAddress}%`]
    );

    if (parseInt(rateCheck.rows[0].count) >= (script.max_keys_per_ip || 1)) {
        throw new Error(`Rate limit exceeded. Try again in ${script.cooldown_hours || 24} hours.`);
    }

    // Verify the script owner's plan allows more keys to be generated
    try {
        const { verifyKeyQuota } = await import("../plans/plans.service.js");
        await verifyKeyQuota(script.owner_id, 1);
    } catch {
        throw new Error("Key limit reached. Please contact the script creator.");
    }

    // Generate key
    const keyValue = generateKeyValue();
    const expiresAt = new Date();
    const keyDuration = Math.min(script.key_duration_hours || 24, 6); // Max 6 hours
    expiresAt.setHours(expiresAt.getHours() + keyDuration);

    // Transaction to insert key and update session
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `INSERT INTO license_keys (key_value, script_id, owner_id, type, status, max_devices, expires_at, note)
             VALUES ($1, $2, $3, 'timed', 'active', 1, $4, $5)`,
            [keyValue, script.id, script.owner_id, expiresAt, `getkey:public:${ipAddress}`]
        );

        // Update the session to keep it around just long enough for the UI to display it (5 mins) before it gets auto-deleted
        await client.query(
            `UPDATE getkey_sessions 
             SET status = 'completed', key_value = $1, expires_at = NOW() + INTERVAL '5 minutes' 
             WHERE id = $2`,
            [keyValue, session.id]
        );

        await client.query('COMMIT');

        logger.info(`Public key generated for script ${script.slug} from IP ${ipAddress} via session`);

        return { keyValue, expiresAt: expiresAt.toISOString() };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};
