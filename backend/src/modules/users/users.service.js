import pool from "../../db/postgres.js";
import crypto from "crypto";

/**
 * Get user public profile by username
 */
export const getUserByUsername = async (username) => {
    const query = `
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.created_at,
           COUNT(s.id) as total_scripts,
           COALESCE(SUM(s.views), 0) as total_views,
           COALESCE(SUM(s.likes), 0) as total_likes
    FROM users u
    LEFT JOIN scripts s ON u.id = s.owner_id AND s.status = 'published' AND s.deleted_at IS NULL
    WHERE u.username = $1 AND u.account_status = 'active'
    GROUP BY u.id
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0];
};

/**
 * Get published scripts by username
 */
export const getScriptsByUsername = async (username) => {
    const query = `
    SELECT s.*, u.username as owner_username, u.display_name as owner_display_name, 
           h.name as hub_name, h.slug as hub_slug,
           g.name as game_name, g.logo_url as game_logo_url
    FROM scripts s
    JOIN users u ON s.owner_id = u.id
    LEFT JOIN hubs h ON s.hub_id = h.id
    LEFT JOIN games g ON s.game_id = g.id
    WHERE u.username = $1 
    AND s.status = 'published'
    AND s.deleted_at IS NULL
    ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query, [username]);
    return result.rows;
};

/**
 * Get user dashboard stats
 */
export const getUserDashboardStats = async (userId) => {
    const query = `
    SELECT 
        COUNT(id) as total_scripts,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(copies), 0) as total_downloads
    FROM scripts 
    WHERE owner_id = $1 
    AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

/**
 * Get user views history (last 30 days)
 */
export const getUserViewsHistory = async (userId) => {
    const query = `
    SELECT 
        TO_CHAR(v.viewed_at, 'YYYY-MM-DD') as date,
        COUNT(v.id) as views
    FROM script_views v
    JOIN scripts s ON v.script_id = s.id
    WHERE s.owner_id = $1
    AND v.viewed_at >= NOW() - INTERVAL '30 days'
    GROUP BY TO_CHAR(v.viewed_at, 'YYYY-MM-DD')
    ORDER BY date ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

/**
 * Get user's API key
 * @param {string} userId
 */
export const getApiKey = async (userId) => {
    const query = `SELECT api_key FROM users WHERE id = $1`;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

/**
 * Generate or regenerate Developer API key
 * @param {string} userId
 */
export const generateApiKey = async (userId) => {
    const apiKey = `shk_${crypto.randomBytes(24).toString("hex")}`;
    const query = `
        UPDATE users 
        SET api_key = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING api_key
    `;
    const result = await pool.query(query, [apiKey, userId]);
    return result.rows[0];
};
