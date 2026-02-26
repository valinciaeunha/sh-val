import pool from "../../db/postgres.js";

/**
 * Create a new executor
 * @param {Object} data - Executor data
 * @returns {Object} Created executor
 */
export const createExecutor = async (data) => {
    const { name, slug, description, website, discord, telegram, platforms, priceModel, logoUrl, bannerUrl, tags, ownerId } = data;

    // Use parameterized queries strictly. Notice we pass the JS array for text[]
    const query = `
    INSERT INTO executors (name, slug, description, website, discord, telegram, platforms, price_model, status, logo_url, banner_url, tags, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12)
    RETURNING *
  `;

    const values = [name, slug, description, website, discord, telegram, platforms, priceModel, logoUrl, bannerUrl, tags, ownerId];

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Check if slug exists
 * @param {string} slug - Executor slug
 * @returns {boolean} True if exists
 */
export const checkSlugExists = async (slug) => {
    const query = "SELECT id FROM executors WHERE slug = $1";
    const result = await pool.query(query, [slug]);
    return result.rows.length > 0;
};

/**
 * Get all active/working executors (public list)
 * @returns {Array} List of executors
 */
export const getAllExecutors = async () => {
    const query = `
    SELECT e.*, u.username as owner_username,
        (SELECT v.version FROM executor_versions v WHERE v.executor_id = e.id ORDER BY v.created_at DESC LIMIT 1) as latest_version
    FROM executors e
    JOIN users u ON e.owner_id = u.id
    WHERE e.status != 'pending'
    ORDER BY e.created_at DESC
  `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Get executors by owner ID
 * @param {string} ownerId - Owner ID
 * @returns {Array} List of executors
 */
export const getMyExecutors = async (ownerId) => {
    const query = `
        SELECT e.*, 
            (SELECT v.version FROM executor_versions v WHERE v.executor_id = e.id ORDER BY v.created_at DESC LIMIT 1) as latest_version
        FROM executors e
        WHERE e.owner_id = $1 
        ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [ownerId]);
    return result.rows;
};

/**
 * Get executor by slug
 * @param {string} slug - Executor slug
 * @returns {Object} Executor data
 */
export const getExecutorBySlug = async (slug) => {
    const query = `
        SELECT e.*, u.username as owner_username
        FROM executors e
        JOIN users u ON e.owner_id = u.id
        WHERE e.slug = $1
    `;
    const result = await pool.query(query, [slug]);
    return result.rows[0];
};

/**
 * Get executor by ID
 * @param {string} id - Executor ID
 * @returns {Object} Executor data
 */
export const getExecutorById = async (id) => {
    const query = "SELECT * FROM executors WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Update an executor
 * @param {string} id - Executor ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated executor
 */
export const updateExecutor = async (id, updateData) => {
    const { name, slug, description, website, discord, telegram, platforms, priceModel, logoUrl, bannerUrl, tags, status } = updateData;

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
    if (website !== undefined) {
        setClause.push(`website = $${paramIndex}`);
        values.push(website);
        paramIndex++;
    }
    if (discord !== undefined) {
        setClause.push(`discord = $${paramIndex}`);
        values.push(discord);
        paramIndex++;
    }
    if (telegram !== undefined) {
        setClause.push(`telegram = $${paramIndex}`);
        values.push(telegram);
        paramIndex++;
    }
    if (platforms !== undefined) {
        setClause.push(`platforms = $${paramIndex}`);
        values.push(platforms);
        paramIndex++;
    }
    if (priceModel !== undefined) {
        setClause.push(`price_model = $${paramIndex}`);
        values.push(priceModel);
        paramIndex++;
    }
    if (logoUrl !== undefined) {
        setClause.push(`logo_url = $${paramIndex}`);
        values.push(logoUrl);
        paramIndex++;
    }
    if (bannerUrl !== undefined) {
        setClause.push(`banner_url = $${paramIndex}`);
        values.push(bannerUrl);
        paramIndex++;
    }
    if (tags !== undefined) {
        setClause.push(`tags = $${paramIndex}`);
        values.push(tags);
        paramIndex++;
    }
    if (status !== undefined) {
        setClause.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
    }

    if (setClause.length === 0) return await getExecutorById(id);

    const query = `
        UPDATE executors 
        SET ${setClause.join(', ')} 
        WHERE id = $1 
        RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Add a new version release
 * @param {Object} data - Version data
 * @returns {Object} Created version
 */
export const addVersion = async (data) => {
    const { executorId, version, downloadUrl, patchNotes } = data;

    const query = `
    INSERT INTO executor_versions (executor_id, version, download_url, patch_notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

    const values = [executorId, version, downloadUrl, patchNotes];

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Get release history for an executor
 * @param {string} executorId - Executor ID
 * @returns {Array} List of versions
 */
export const getVersions = async (executorId) => {
    const query = `
        SELECT * FROM executor_versions
        WHERE executor_id = $1
        ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [executorId]);
    return result.rows;
};

/**
 * Update a specific version release
 * @param {string} versionId - Version ID
 * @param {Object} updateData - Data to update (version, downloadUrl, patchNotes)
 * @returns {Object} Updated version
 */
export const updateVersion = async (versionId, updateData) => {
    const { version, downloadUrl, patchNotes } = updateData;

    const query = `
        UPDATE executor_versions
        SET version = COALESCE($1, version),
            download_url = COALESCE($2, download_url),
            patch_notes = COALESCE($3, patch_notes)
        WHERE id = $4
        RETURNING *
    `;

    const values = [version, downloadUrl, patchNotes, versionId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Delete a specific version release
 * @param {string} versionId - Version ID
 * @returns {boolean} True if deleted
 */
export const deleteVersion = async (versionId) => {
    const query = `DELETE FROM executor_versions WHERE id = $1`;
    const result = await pool.query(query, [versionId]);
    return result.rowCount > 0;
};
