import pool from "../../db/postgres.js";
import crypto from "crypto";

/**
 * Generate a clean slug for games without random numbers
 */
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

/**
 * Find a game by its platform ID
 */
export const findByPlatformId = async (gamePlatformId) => {
    const query = "SELECT * FROM games WHERE game_platform_id = $1";
    const result = await pool.query(query, [gamePlatformId]);
    return result.rows[0] || null;
};

/**
 * Find a game by its slug
 */
export const findBySlug = async (slug) => {
    const query = "SELECT * FROM games WHERE slug = $1";
    const result = await pool.query(query, [slug]);
    return result.rows[0] || null;
};

/**
 * Find a game by ID
 */
export const getGameById = async (id) => {
    const query = "SELECT * FROM games WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

/**
 * Create a new game
 */
export const createGame = async (data) => {
    const { name, gamePlatformId, platform = "roblox", logoUrl, bannerUrl } = data;
    const baseSlug = generateSlug(name);
    let slug = baseSlug;

    // Handle collision: if slug exists, append a number
    let counter = 1;
    while (await findBySlug(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    const query = `
        INSERT INTO games (name, game_platform_id, platform, logo_url, banner_url, slug)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const result = await pool.query(query, [name, gamePlatformId, platform, logoUrl, bannerUrl, slug]);
    return result.rows[0];
};

/**
 * Find or create a game by platform ID
 * If game_platform_id exists, return it. Otherwise create new game.
 */
export const findOrCreateGame = async (data) => {
    const { gamePlatformId } = data;

    if (gamePlatformId) {
        const existing = await findByPlatformId(gamePlatformId);
        if (existing) return existing;
    }

    return await createGame(data);
};

/**
 * Get all games
 */
export const getAllGames = async () => {
    const query = `
        SELECT g.*,
            (SELECT COUNT(*) FROM scripts s 
             WHERE s.game_id = g.id AND s.status = 'published' AND s.deleted_at IS NULL
            )::int AS script_count
        FROM games g
        ORDER BY script_count DESC, g.name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Search games by name
 */
export const searchGames = async (searchQuery) => {
    const query = "SELECT * FROM games WHERE name ILIKE $1 ORDER BY name ASC LIMIT 20";
    const result = await pool.query(query, [`%${searchQuery}%`]);
    return result.rows;
};

/**
 * Update a game
 */
export const updateGame = async (id, updateData) => {
    const { name, logoUrl, bannerUrl } = updateData;
    const setClause = [];
    const values = [id];
    let paramIndex = 2;

    if (name !== undefined) {
        setClause.push(`name = $${paramIndex}`);
        values.push(name);
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

    if (setClause.length === 0) return null;

    const query = `
        UPDATE games
        SET ${setClause.join(", ")}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
};
/**
 * Get game by slug with its scripts
 */
export const getGameBySlugWithScripts = async (slug) => {
    const gameQuery = "SELECT * FROM games WHERE slug = $1";
    const gameResult = await pool.query(gameQuery, [slug]);
    const game = gameResult.rows[0];

    if (!game) return null;

    const scriptsQuery = `
        SELECT s.*, u.username as owner_username, u.display_name as owner_display_name,
               g.name as game_name, g.logo_url as game_logo_url
        FROM scripts s
        JOIN users u ON s.owner_id = u.id
        JOIN games g ON s.game_id = g.id
        WHERE s.game_id = $1 AND s.status = 'published' AND s.deleted_at IS NULL
        ORDER BY s.created_at DESC
    `;
    const scriptsResult = await pool.query(scriptsQuery, [game.id]);

    return {
        ...game,
        scripts: scriptsResult.rows
    };
};
