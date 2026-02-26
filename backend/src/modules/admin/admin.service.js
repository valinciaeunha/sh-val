import pool from "../../db/postgres.js";

/**
 * Get platform-wide admin stats
 */
export const getAdminStats = async () => {
    const result = await pool.query(`
        SELECT
            (SELECT COUNT(*) FROM users WHERE account_status != 'deleted')::int AS total_users,
            (SELECT COUNT(*) FROM scripts WHERE deleted_at IS NULL)::int AS total_scripts,
            (SELECT COUNT(*) FROM deployments)::int AS total_deployments,
            (SELECT COUNT(*) FROM license_keys)::int AS total_keys
    `);
    return result.rows[0];
};

/**
 * Get paginated list of all users with their roles
 * Search by username, email, display_name
 */
export const getAdminUsers = async ({ limit = 50, offset = 0, search = "" } = {}) => {
    const searchParam = `%${search}%`;
    const query = `
        SELECT
            u.id,
            u.username,
            u.display_name,
            u.email,
            u.account_status,
            u.created_at,
            COALESCE(
                ARRAY_AGG(DISTINCT r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL),
                ARRAY[]::text[]
            ) AS roles,
            COALESCE(
                ARRAY_AGG(DISTINCT ap.provider ORDER BY ap.provider) FILTER (WHERE ap.provider IS NOT NULL),
                ARRAY[]::text[]
            ) AS providers
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN auth_providers ap ON u.id = ap.user_id
        WHERE u.account_status != 'deleted'
          AND (
              $3 = '' OR
              CAST(u.id AS text) ILIKE $3 OR
              u.username ILIKE $3 OR
              u.email ILIKE $3 OR
              u.display_name ILIKE $3
          )
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
    `;
    const countQuery = `
        SELECT COUNT(*)::int AS total
        FROM users u
        WHERE u.account_status != 'deleted'
          AND (
              $1 = '' OR
              CAST(u.id AS text) ILIKE $1 OR
              u.username ILIKE $1 OR
              u.email ILIKE $1 OR
              u.display_name ILIKE $1
          )
    `;
    const [rows, countRow] = await Promise.all([
        pool.query(query, [limit, offset, searchParam]),
        pool.query(countQuery, [searchParam]),
    ]);
    return {
        users: rows.rows,
        total: countRow.rows[0].total,
    };
};

/**
 * Update user profile fields
 */
export const updateUser = async (userId, fields) => {
    const allowed = ['username', 'email', 'display_name', 'bio', 'avatar_url'];
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
        if (allowed.includes(k) && v !== undefined) {
            sets.push(`${k} = $${i++}`);
            vals.push(v);
        }
    }
    if (sets.length === 0) throw { statusCode: 400, message: 'No valid fields' };
    vals.push(userId);
    const result = await pool.query(
        `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING id, username, email, display_name, bio, avatar_url, account_status, updated_at`,
        vals
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'User not found' };
    return result.rows[0];
};

/**
 * Set user account_status (active | suspended | banned)
 */
export const setUserStatus = async (userId, status) => {
    const allowed = ['active', 'suspended'];
    if (!allowed.includes(status)) throw { statusCode: 400, message: `Invalid status. Allowed: ${allowed.join(', ')}` };
    const result = await pool.query(
        `UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, account_status`,
        [status, userId]
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'User not found' };
    return result.rows[0];
};

/**
 * Replace all roles for a user
 */
export const setUserRoles = async (userId, roleNames) => {
    // Get role IDs
    const rolesResult = await pool.query(
        `SELECT id, name FROM roles WHERE name = ANY($1)`,
        [roleNames]
    );
    const roleIds = rolesResult.rows;
    if (roleIds.length !== roleNames.length) {
        const found = roleIds.map(r => r.name);
        const missing = roleNames.filter(n => !found.includes(n));
        throw { statusCode: 400, message: `Unknown roles: ${missing.join(', ')}` };
    }

    // Replace in transaction
    await pool.query('BEGIN');
    try {
        await pool.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);
        for (const role of roleIds) {
            await pool.query(
                `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [userId, role.id]
            );
        }
        await pool.query('COMMIT');
    } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
    }

    const updated = await pool.query(
        `SELECT ARRAY_AGG(r.name ORDER BY r.name) AS roles FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`,
        [userId]
    );
    return { userId, roles: updated.rows[0]?.roles ?? [] };
};

/**
 * Get paginated list of all scripts system-wide with owner and hub info
 */
export const getAdminScripts = async ({ limit = 50, offset = 0, search = '', status = '' } = {}) => {
    const searchParam = `%${search}%`;
    const query = `
        SELECT
            s.id,
            s.title,
            s.slug,
            s.status,
            s.views,
            s.likes,
            s.is_paid,
            s.created_at,
            u.username AS owner_username,
            u.display_name AS owner_display_name,
            h.name AS hub_name
        FROM scripts s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN hubs h ON s.hub_id = h.id
        WHERE s.deleted_at IS NULL
          AND ($3 = '' OR s.title ILIKE $3 OR s.slug ILIKE $3 OR u.username ILIKE $3)
          AND ($4 = '' OR s.status = $4)
        ORDER BY s.created_at DESC
        LIMIT $1 OFFSET $2
    `;
    const countQuery = `
        SELECT COUNT(*)::int AS total
        FROM scripts s
        LEFT JOIN users u ON s.owner_id = u.id
        WHERE s.deleted_at IS NULL
          AND ($1 = '' OR s.title ILIKE $1 OR s.slug ILIKE $1 OR u.username ILIKE $1)
          AND ($2 = '' OR s.status = $2)
    `;
    const [rows, countRow] = await Promise.all([
        pool.query(query, [limit, offset, searchParam, status]),
        pool.query(countQuery, [searchParam, status]),
    ]);
    return { scripts: rows.rows, total: countRow.rows[0].total };
};

/**
 * Soft-delete a script
 */
export const deleteScript = async (scriptId) => {
    const result = await pool.query(
        `UPDATE scripts SET deleted_at = NOW(), status = 'deleted' WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
        [scriptId]
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Script not found or already deleted' };
    return { deleted: true };
};

/**
 * Update script status (admin review actions)
 * Allowed transitions: under_review → published | draft
 *                      draft → published
 *                      published → draft
 */
export const updateScriptStatus = async (scriptId, status) => {
    const allowed = ['published', 'draft', 'under_review'];
    if (!allowed.includes(status)) throw { statusCode: 400, message: `Invalid status. Allowed: ${allowed.join(', ')}` };
    const result = await pool.query(
        `UPDATE scripts SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING id, title, status`,
        [status, scriptId]
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Script not found' };
    return result.rows[0];
};

/**
 * Get paginated list of all deployments system-wide with owner info
 */
export const getAdminDeployments = async ({ limit = 50, offset = 0, search = '', status = '' } = {}) => {
    const searchParam = `%${search}%`;
    const rows = await pool.query(`
        SELECT
            d.id,
            d.title,
            d.deploy_key,
            d.file_size,
            d.mime_type,
            d.status,
            d.cdn_requests,
            d.created_at,
            u.username AS owner_username,
            u.display_name AS owner_display_name
        FROM deployments d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE ($3 = '' OR d.title ILIKE $3 OR d.deploy_key ILIKE $3 OR u.username ILIKE $3)
          AND ($4 = '' OR d.status = $4)
        ORDER BY d.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset, searchParam, status]);
    const countRow = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM deployments d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE ($1 = '' OR d.title ILIKE $1 OR d.deploy_key ILIKE $1 OR u.username ILIKE $1)
          AND ($2 = '' OR d.status = $2)
    `, [searchParam, status]);
    return { deployments: rows.rows, total: countRow.rows[0].total };
};

/**
 * Hard-delete a deployment record (admin only)
 */
export const deleteDeployment = async (deploymentId) => {
    const result = await pool.query(
        `DELETE FROM deployments WHERE id = $1 RETURNING id`,
        [deploymentId]
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Deployment not found' };
    return { deleted: true };
};

/**
 * Get paginated list of all license keys system-wide
 */
export const getAdminKeys = async ({ limit = 50, offset = 0, search = '', status = '' } = {}) => {
    const searchParam = `%${search}%`;
    const rows = await pool.query(`
        SELECT
            k.id,
            k.key_value,
            k.type,
            k.status,
            k.max_devices,
            k.expires_at,
            k.last_activity_at,
            k.created_at,
            k.note,
            u.username AS owner_username,
            u.display_name AS owner_display_name,
            s.title AS script_title,
            s.slug AS script_slug
        FROM license_keys k
        LEFT JOIN users u ON k.owner_id = u.id
        LEFT JOIN scripts s ON k.script_id = s.id
        WHERE ($3 = '' OR k.key_value ILIKE $3 OR u.username ILIKE $3 OR s.title ILIKE $3)
          AND ($4 = '' OR k.status::text = $4)
        ORDER BY k.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset, searchParam, status]);
    const countRow = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM license_keys k
        LEFT JOIN users u ON k.owner_id = u.id
        LEFT JOIN scripts s ON k.script_id = s.id
        WHERE ($1 = '' OR k.key_value ILIKE $1 OR u.username ILIKE $1 OR s.title ILIKE $1)
          AND ($2 = '' OR k.status::text = $2)
    `, [searchParam, status]);
    return { keys: rows.rows, total: countRow.rows[0].total };
};

/** Revoke (delete) a license key */
export const deleteKey = async (keyId) => {
    const result = await pool.query(`DELETE FROM license_keys WHERE id = $1 RETURNING id`, [keyId]);
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Key not found' };
    return { deleted: true };
};

/** Get paginated hubs list for admin */
export const getAdminHubs = async ({ limit = 50, offset = 0, search = '', status = '' } = {}) => {
    const s = `%${search}%`;
    const rows = await pool.query(`
        SELECT
            h.id, h.name, h.slug, h.status, h.is_official, h.is_verified,
            h.discord_server, h.created_at,
            u.username AS owner_username,
            u.display_name AS owner_display_name,
            COUNT(sc.id)::int AS script_count
        FROM hubs h
        LEFT JOIN users u ON h.owner_id = u.id
        LEFT JOIN scripts sc ON sc.hub_id = h.id AND sc.deleted_at IS NULL
        WHERE ($3 = '' OR h.name ILIKE $3 OR h.slug ILIKE $3 OR u.username ILIKE $3)
          AND ($4 = '' OR h.status::text = $4)
        GROUP BY h.id, u.username, u.display_name
        ORDER BY h.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset, s, status]);
    const countRow = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM hubs h LEFT JOIN users u ON h.owner_id = u.id
        WHERE ($1 = '' OR h.name ILIKE $1 OR h.slug ILIKE $1 OR u.username ILIKE $1)
          AND ($2 = '' OR h.status::text = $2)
    `, [s, status]);
    return { hubs: rows.rows, total: countRow.rows[0].total };
};

/** Delete a hub */
export const deleteHub = async (hubId) => {
    const result = await pool.query(`DELETE FROM hubs WHERE id = $1 RETURNING id`, [hubId]);
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Hub not found' };
    return { deleted: true };
};

/** Update hub status (admin review) */
export const updateHubStatus = async (hubId, status) => {
    const allowed = ['active', 'pending', 'suspended'];
    if (!allowed.includes(status)) throw { statusCode: 400, message: `Invalid status. Allowed: ${allowed.join(', ')}` };
    const result = await pool.query(
        `UPDATE hubs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, status`,
        [status, hubId]
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Hub not found' };
    return result.rows[0];
};

/** Get paginated executors list for admin */
export const getAdminExecutors = async ({ limit = 50, offset = 0, search = '', status = '' } = {}) => {
    const s = `%${search}%`;
    const rows = await pool.query(`
        SELECT
            e.id, e.name, e.slug, e.status, e.created_at, e.price_model,
            u.username AS owner_username,
            (SELECT COUNT(*) FROM executor_versions v WHERE v.executor_id = e.id)::int AS version_count
        FROM executors e
        LEFT JOIN users u ON e.owner_id = u.id
        WHERE ($3 = '' OR e.name ILIKE $3 OR e.slug ILIKE $3 OR u.username ILIKE $3)
          AND ($4 = '' OR e.status::text = $4)
        ORDER BY e.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset, s, status]);
    const countRow = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM executors e LEFT JOIN users u ON e.owner_id = u.id
        WHERE ($1 = '' OR e.name ILIKE $1 OR e.slug ILIKE $1 OR u.username ILIKE $1)
          AND ($2 = '' OR e.status::text = $2)
    `, [s, status]);
    return { data: rows.rows, total: countRow.rows[0].total };
};

/** Update executor status (admin review) */
export const updateExecutorStatus = async (executorId, status) => {
    const allowed = ['active', 'pending', 'rejected', 'archived'];
    if (!allowed.includes(status)) throw { statusCode: 400, message: `Invalid status. Allowed: ${allowed.join(', ')}` };
    const result = await pool.query(
        `UPDATE executors SET status = $1::executor_status, updated_at = NOW() WHERE id = $2 RETURNING id, name, status`,
        [status, executorId]
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Executor not found' };
    return result.rows[0];
};

/** Get paginated user plans for admin */
export const getAdminPlans = async ({ limit = 50, offset = 0, search = '', planType = '' } = {}) => {
    const s = `%${search}%`;
    const rows = await pool.query(`
        SELECT
            up.id,
            up.user_id,
            up.plan_type,
            up.started_at,
            up.expires_at,
            up.created_at,
            u.username,
            u.display_name,
            u.email,
            um.maximum_obfuscation,
            um.maximum_keys,
            um.maximum_deployments,
            um.maximum_devices_per_key,
            um.maximums_reset_at
        FROM user_plans up
        JOIN users u ON up.user_id = u.id
        LEFT JOIN user_maximums um ON up.user_id = um.user_id
        WHERE ($3 = '' OR u.username ILIKE $3 OR u.email ILIKE $3 OR u.display_name ILIKE $3)
          AND ($4 = '' OR up.plan_type::text = $4)
        ORDER BY up.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset, s, planType]);
    const countRow = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM user_plans up
        JOIN users u ON up.user_id = u.id
        WHERE ($1 = '' OR u.username ILIKE $1 OR u.email ILIKE $1 OR u.display_name ILIKE $1)
          AND ($2 = '' OR up.plan_type::text = $2)
    `, [s, planType]);
    return { plans: rows.rows, total: countRow.rows[0].total };
};

/** Update a user's plan (admin) */
export const updateUserPlan = async (planId, planType, expiresAt = null, customMaximums = null) => {
    const allowed = ['free', 'pro', 'enterprise', 'custom'];
    if (!allowed.includes(planType)) throw { statusCode: 400, message: `Invalid plan. Allowed: ${allowed.join(', ')}` };

    // If no expiry provided, default to 30 days from now
    const useExpiry = expiresAt || null;
    const expirySql = useExpiry
        ? `$2::timestamp`
        : `NOW() + INTERVAL '30 days'`;

    // Update plan
    const result = await pool.query(
        `UPDATE user_plans SET plan_type = $1::plan_type, expires_at = ${expirySql}, started_at = NOW(), updated_at = NOW() WHERE id = ${useExpiry ? '$3' : '$2'} RETURNING *`,
        useExpiry ? [planType, useExpiry, planId] : [planType, planId]
    );
    if (result.rowCount === 0) throw { statusCode: 404, message: 'Plan not found' };

    const plan = result.rows[0];

    // Determine maximums: use custom values if provided, otherwise use tier defaults
    let obsMax = 0, keyMax = 10, devMax = 3, devPerKey = 1;
    if (planType === 'pro') { obsMax = 50; keyMax = 5000; devMax = 100; devPerKey = 2; }
    else if (planType === 'enterprise') { obsMax = 50000; keyMax = 50000; devMax = 10000; devPerKey = 10; }
    else if (planType === 'custom') { obsMax = 50000; keyMax = 50000; devMax = 10000; devPerKey = 50; }

    if (customMaximums) {
        if (customMaximums.deployments !== undefined) devMax = parseInt(customMaximums.deployments) || 0;
        if (customMaximums.keys !== undefined) keyMax = parseInt(customMaximums.keys) || 0;
        if (customMaximums.obfuscation !== undefined) obsMax = parseInt(customMaximums.obfuscation) || 0;
        if (customMaximums.devicesPerKey !== undefined) devPerKey = parseInt(customMaximums.devicesPerKey) || 1;
    }

    await pool.query(
        `UPDATE user_maximums SET maximum_obfuscation = $2, maximum_keys = $3, maximum_deployments = $4, maximum_devices_per_key = $5, maximums_reset_at = (NOW() + INTERVAL '30 days'), updated_at = NOW() WHERE user_id = $1`,
        [plan.user_id, obsMax, keyMax, devMax, devPerKey]
    );

    return plan;
};
