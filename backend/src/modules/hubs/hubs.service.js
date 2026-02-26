import pool from "../../db/postgres.js";

/**
 * Create a new hub
 * @param {Object} hubData - Hub data
 * @returns {Object} Created hub
 */
export const createHub = async (hubData) => {
    const { name, slug, description, bannerUrl, logoUrl, ownerId, discordServer } = hubData;

    const query = `
    INSERT INTO hubs (name, slug, description, banner_url, logo_url, owner_id, status, discord_server)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
    RETURNING *
  `;

    const values = [name, slug, description, bannerUrl, logoUrl, ownerId, discordServer];

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Check if slug exists
 * @param {string} slug - Hub slug
 * @returns {boolean} True if exists
 */
export const checkSlugExists = async (slug) => {
    const query = "SELECT id FROM hubs WHERE slug = $1";
    const result = await pool.query(query, [slug]);
    return result.rows.length > 0;
};

/**
 * Get hubs by owner ID
 * @param {string} ownerId - Owner ID
 * @returns {Array} List of hubs
 */
export const getHubsByOwner = async (ownerId) => {
    const query = `
        SELECT h.*, 
            (SELECT COUNT(*) FROM scripts s WHERE s.hub_id = h.id AND s.deleted_at IS NULL) AS script_count
        FROM hubs h
        WHERE h.owner_id = $1 
        ORDER BY h.created_at DESC
    `;
    const result = await pool.query(query, [ownerId]);
    return result.rows;
};

/**
 * Check if user already has a hub
 * @param {string} ownerId - Owner ID
 * @returns {boolean} True if exists
 */
export const checkHubExistsForOwner = async (ownerId) => {
    const query = "SELECT id FROM hubs WHERE owner_id = $1";
    const result = await pool.query(query, [ownerId]);
    return result.rows.length > 0;
};

/**
 * Get all active hubs
 * @returns {Array} List of active hubs
 */
export const getAllActiveHubs = async () => {
    const query = `
    SELECT * FROM hubs 
    WHERE status = 'active'
    ORDER BY is_official DESC, is_verified DESC, created_at DESC
  `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Get hub by ID
 * @param {string} id - Hub ID
 * @returns {Object} Hub data
 */
export const getHubById = async (id) => {
    const query = "SELECT * FROM hubs WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Get hub by slug
 * @param {string} slug - Hub slug
 * @returns {Object} Hub data
 */
export const getHubBySlug = async (slug) => {
    const query = "SELECT * FROM hubs WHERE slug = $1";
    const result = await pool.query(query, [slug]);
    return result.rows[0];
};

/**
 * Update a hub
 * @param {string} id - Hub ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated hub
 */
export const updateHub = async (id, updateData) => {
    const { name, slug, description, bannerUrl, logoUrl, discordServer, status } = updateData;

    // Use COALESCE to keep existing values if new ones are null/undefined
    // Note: This query assumes full object or handles undefined in builder. 
    // A better approach for partial updates is dynamic query building.
    // For simplicity with pg, we'll use COALESCE with existing values, 
    // but standard SQL UPDATE doesn't support "COALESCE(?, current_column_value)" easily without passing it.
    // Instead, we'll build the SET clause dynamically.

    const setClause = [];
    const values = [id];
    let paramIndex = 2;

    if (name !== undefined) {
        setClause.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
    }
    if (slug !== undefined) {
        setClause.push(`slug = $${paramIndex}`);
        values.push(slug);
        paramIndex++;
    }
    if (description !== undefined) {
        setClause.push(`description = $${paramIndex}`);
        values.push(description);
        paramIndex++;
    }
    if (bannerUrl !== undefined) {
        setClause.push(`banner_url = $${paramIndex}`);
        values.push(bannerUrl);
        paramIndex++;
    }
    if (logoUrl !== undefined) {
        setClause.push(`logo_url = $${paramIndex}`);
        values.push(logoUrl);
        paramIndex++;
    }
    if (discordServer !== undefined) {
        setClause.push(`discord_server = $${paramIndex}`);
        values.push(discordServer);
        paramIndex++;
    }
    if (status !== undefined) {
        setClause.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
    }

    if (setClause.length === 0) return null; // Nothing to update

    const query = `
        UPDATE hubs 
        SET ${setClause.join(", ")}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Add a script to a hub (set hub_id on the script)
 * @param {string} hubId - Hub ID
 * @param {string} scriptId - Script ID
 * @returns {Object} Updated script
 */
export const addScriptToHub = async (hubId, scriptId) => {
    const query = `
        UPDATE scripts SET hub_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [hubId, scriptId]);
    return result.rows[0];
};

/**
 * Remove a script from a hub (set hub_id to NULL)
 * @param {string} scriptId - Script ID
 * @returns {Object} Updated script
 */
export const removeScriptFromHub = async (scriptId) => {
    const query = `
        UPDATE scripts SET hub_id = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const result = await pool.query(query, [scriptId]);
    return result.rows[0];
};

/**
 * Get scripts belonging to a hub (any status, for hub owner management)
 * @param {string} hubId - Hub ID
 * @returns {Array} Scripts in hub
 */
export const getHubScripts = async (hubId) => {
    const query = `
        SELECT s.*, g.name as game_name, g.logo_url as game_logo_url
        FROM scripts s
        LEFT JOIN games g ON s.game_id = g.id
        WHERE s.hub_id = $1 AND s.deleted_at IS NULL
        ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query, [hubId]);
    return result.rows;
};
