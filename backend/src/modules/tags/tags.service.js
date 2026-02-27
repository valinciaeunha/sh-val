import pool from "../../db/postgres.js";

/**
 * Find or create a tag by name
 */
export const findOrCreateTag = async (name) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return null;

    const slug = trimmed
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Try to find existing tag
    const existing = await pool.query("SELECT * FROM tags WHERE slug = $1", [slug]);
    if (existing.rows[0]) return existing.rows[0];

    // Create new tag
    const result = await pool.query(
        "INSERT INTO tags (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING *",
        [trimmed, slug]
    );
    return result.rows[0];
};

/**
 * Set tags for a script (replace all existing tags)
 */
export const setScriptTags = async (scriptId, tagNames) => {
    if (!tagNames || tagNames.length === 0) {
        // Remove all tags
        await pool.query("DELETE FROM script_tags WHERE script_id = $1", [scriptId]);
        return [];
    }

    // Find or create all tags
    const tags = [];
    for (const name of tagNames) {
        const tag = await findOrCreateTag(name);
        if (tag) tags.push(tag);
    }

    // Clear existing script_tags
    await pool.query("DELETE FROM script_tags WHERE script_id = $1", [scriptId]);

    // Insert new script_tags
    for (const tag of tags) {
        await pool.query(
            "INSERT INTO script_tags (script_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [scriptId, tag.id]
        );
    }

    return tags;
};

/**
 * Get tags for a script
 */
export const getTagsByScriptId = async (scriptId) => {
    const query = `
        SELECT t.* FROM tags t
        INNER JOIN script_tags st ON st.tag_id = t.id
        WHERE st.script_id = $1
        ORDER BY t.name ASC
    `;
    const result = await pool.query(query, [scriptId]);
    return result.rows;
};

/**
 * Get all tags
 */
export const getAllTags = async () => {
    const result = await pool.query("SELECT * FROM tags ORDER BY name ASC");
    return result.rows;
};

/**
 * Search tags by name
 */
export const searchTags = async (query) => {
    const result = await pool.query(
        "SELECT * FROM tags WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10",
        [`%${query}%`]
    );
    return result.rows;
};
