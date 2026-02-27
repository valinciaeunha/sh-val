import pool from "../../db/postgres.js";
import crypto from "crypto";
import s3Client from "../../config/s3.js";
import config from "../../config/index.js";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Generate a random deploy key (32 hex chars + .lua)
 */
function generateDeployKey() {
    return crypto.randomBytes(16).toString("hex") + ".lua";
}

/**
 * Get deployments for a user (paginated)
 */
export async function getMyDeployments(userId, options = {}) {
    const { page = 1, limit = 20, search = "" } = options;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE d.user_id = $1";
    const params = [userId];
    let paramIdx = 2;

    if (search) {
        whereClause += ` AND d.title ILIKE $${paramIdx}`;
        params.push(`%${search}%`);
        paramIdx++;
    }

    // Count total
    const countResult = await pool.query(
        `SELECT COUNT(*) FROM deployments d ${whereClause}`,
        params.slice(0, paramIdx - 1)
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get deployments
    params.push(limit, offset);
    const result = await pool.query(
        `SELECT d.id, d.title, d.deploy_key, d.s3_key, d.file_size, d.mime_type, d.status, d.created_at, d.updated_at
         FROM deployments d
         ${whereClause}
         ORDER BY d.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        params
    );

    return {
        deployments: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get deployment stats for a user
 */
export async function getStats(userId) {
    const result = await pool.query(
        `SELECT 
            COUNT(*)::int AS total_deployments,
            COUNT(*) FILTER (WHERE status = 'active')::int AS active_deployments,
            COALESCE(SUM(file_size), 0)::bigint AS total_size,
            COALESCE(SUM(cdn_requests), 0)::bigint AS cdn_requests
         FROM deployments 
         WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

/**
 * Get a deployment by deploy_key (public — no auth required)
 */
export async function getByDeployKey(deployKey) {
    const result = await pool.query(
        `SELECT id, s3_key, mime_type, title, status FROM deployments WHERE deploy_key = $1 AND status = 'active'`,
        [deployKey]
    );
    return result.rows[0] || null;
}

/**
 * Increment cdn_requests counter for a deployment (fire-and-forget safe)
 */
export async function incrementCdnRequests(deployKey) {
    await pool.query(
        `UPDATE deployments SET cdn_requests = cdn_requests + 1 WHERE deploy_key = $1`,
        [deployKey]
    );
}

/**
 * Get a single deployment by ID (must belong to user)
 */
export async function getById(id, userId) {
    const result = await pool.query(
        `SELECT id, title, deploy_key, s3_key, file_size, mime_type, status, created_at, updated_at
         FROM deployments
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return result.rows[0] || null;
}

/**
 * Get file content from S3
 */
export async function getContent(s3Key) {
    const command = new GetObjectCommand({
        Bucket: config.s3.bucketScripts,
        Key: s3Key,
    });
    const response = await s3Client.send(command);
    return await response.Body.transformToString("utf-8");
}

/**
 * Create a new deployment (upload to S3 + insert DB row)
 */
export async function create(userId, { title, content }) {
    const deployKey = generateDeployKey();
    const shortUserId = userId.substring(0, 8);
    const s3Key = `v1/${shortUserId}/${deployKey}`;
    const contentBuffer = Buffer.from(content, "utf-8");

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
        Bucket: config.s3.bucketScripts,
        Key: s3Key,
        Body: contentBuffer,
        ContentType: "text/plain",
    }));

    // Insert into DB
    const result = await pool.query(
        `INSERT INTO deployments (user_id, title, deploy_key, s3_key, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, deploy_key, s3_key, file_size, mime_type, status, created_at, updated_at`,
        [userId, title, deployKey, s3Key, contentBuffer.length, "text/plain"]
    );

    return result.rows[0];
}

/**
 * Update a deployment (re-upload to S3 + update DB)
 */
export async function update(id, userId, { title, content }) {
    // Get existing deployment
    const existing = await getById(id, userId);
    if (!existing) return null;

    const updates = [];
    const params = [];
    let paramIdx = 1;

    if (title !== undefined) {
        updates.push(`title = $${paramIdx}`);
        params.push(title);
        paramIdx++;
    }

    if (content !== undefined) {
        const contentBuffer = Buffer.from(content, "utf-8");

        // Re-upload to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: config.s3.bucketScripts,
            Key: existing.s3_key,
            Body: contentBuffer,
            ContentType: "text/plain",
        }));

        updates.push(`file_size = $${paramIdx}`);
        params.push(contentBuffer.length);
        paramIdx++;
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = NOW()`);
    params.push(id, userId);

    const result = await pool.query(
        `UPDATE deployments SET ${updates.join(", ")}
         WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1}
         RETURNING id, title, deploy_key, s3_key, file_size, mime_type, status, created_at, updated_at`,
        params
    );

    return result.rows[0] || null;
}

/**
 * Delete a deployment (remove from S3 + DB)
 */
export async function remove(id, userId) {
    // Get existing
    const existing = await getById(id, userId);
    if (!existing) return false;

    // Delete from S3
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: config.s3.bucketScripts,
            Key: existing.s3_key,
        }));
    } catch (err) {
        // S3 delete failure is non-critical, continue with DB delete
    }

    // Delete from DB
    const result = await pool.query(
        "DELETE FROM deployments WHERE id = $1 AND user_id = $2",
        [id, userId]
    );

    return result.rowCount > 0;
}

/**
 * Count user's deployments (for quota check)
 */
export async function countByUser(userId) {
    const result = await pool.query(
        "SELECT COUNT(*)::int AS count FROM deployments WHERE user_id = $1",
        [userId]
    );
    return result.rows[0].count;
}

/**
 * Create deployment from physical file upload (multer S3)
 */
export async function createFromUpload(userId, { title, file }) {
    // We already have the file in S3 thanks to multer-s3
    // We just need to extract the deploy_key from the filename and insert into DB

    // multer-s3 sets file.key and file.location
    const s3Key = file.key;

    // Generate our 32-char + .lua deploy key
    const deployKey = generateDeployKey();

    // Determine the size and mime_type from multer
    const fileSize = file.size || 0;
    const mimeType = file.mimetype || "application/octet-stream";

    // Insert into DB
    const result = await pool.query(
        `INSERT INTO deployments (user_id, title, deploy_key, s3_key, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, deploy_key, s3_key, file_size, mime_type, status, created_at, updated_at`,
        [userId, title, deployKey, s3Key, fileSize, mimeType]
    );

    return result.rows[0];
}
