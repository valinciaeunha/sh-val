import * as scriptService from "./scripts.service.js";
import * as gameService from "../games/games.service.js";
import * as tagService from "../tags/tags.service.js";
import { checkRateLimit } from "../../db/redis.js";
import { body, validationResult } from "express-validator";
import logger from "../../utils/logger.js";
import { deleteS3Object } from "../../utils/s3Delete.js";
import { lookupRobloxGame } from "../../utils/roblox.js";

/**
 * Validation Rules for creating a script
 */
export const createScriptValidation = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Script title is required")
        .isLength({ min: 3, max: 150 })
        .withMessage("Title must be between 3 and 150 characters"),
    body("description")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 10000 })
        .withMessage("Description cannot exceed 10000 characters"),
    body("loaderUrl")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Loader URL cannot exceed 2000 characters"),
    body("gamePlatformId")
        .trim()
        .notEmpty()
        .withMessage("Game ID or Link is required")
        .isLength({ max: 200 })
        .withMessage("Game ID/Link cannot exceed 200 characters"),
    body("tags")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage("Tags cannot exceed 500 characters"),
    body("isPaid").optional().toBoolean(),
    body("purchaseUrl").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("Purchase URL is too long"),
    body("hasKeySystem").optional().toBoolean(),
    body("keySystemUrl").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("Key System URL is too long"),
];

/**
 * Validation Rules for updating a script
 */
export const updateScriptValidation = [
    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Script title cannot be empty")
        .isLength({ min: 3, max: 150 })
        .withMessage("Title must be between 3 and 150 characters"),
    body("description")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 10000 })
        .withMessage("Description cannot exceed 10000 characters"),
    body("loaderUrl")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Loader URL cannot exceed 2000 characters"),
    body("gamePlatformId")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 200 })
        .withMessage("Game ID/Link cannot exceed 200 characters"),
    body("tags")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage("Tags cannot exceed 500 characters"),
    body("isPaid").optional().toBoolean(),
    body("purchaseUrl").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("Purchase URL is too long"),
    body("hasKeySystem").optional().toBoolean(),
    body("keySystemUrl").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("Key System URL is too long"),
];

/**
 * Resolve game from gamePlatformId using Roblox API
 * Auto-fetches name, icon, and thumbnail
 */
const resolveGame = async (gamePlatformId) => {
    if (!gamePlatformId) return null;

    // First check if a game with this platform ID already exists
    const existing = await gameService.findByPlatformId(gamePlatformId);
    if (existing) return existing;

    // Lookup from Roblox API
    logger.info("Looking up Roblox game for: %s", gamePlatformId);
    const robloxGame = await lookupRobloxGame(gamePlatformId);

    if (!robloxGame) {
        logger.warn("Could not resolve Roblox game for: %s", gamePlatformId);
        return null;
    }

    // Also check by universe ID (may differ from input)
    const existingByUniverse = await gameService.findByPlatformId(robloxGame.universeId);
    if (existingByUniverse) return existingByUniverse;

    // Create the game with fetched data
    const game = await gameService.createGame({
        name: robloxGame.name,
        gamePlatformId: robloxGame.universeId,
        platform: "roblox",
        logoUrl: robloxGame.iconUrl,
        bannerUrl: robloxGame.thumbnailUrl,
    });

    logger.info("Auto-created Roblox game: %s (universe: %s)", robloxGame.name, robloxGame.universeId);
    return game;
};

/**
 * Create a new script
 * POST /api/scripts
 */
export const createScript = async (req, res) => {
    try {
        // 1. Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn("Script Creation Validation Errors: %o", errors.array());
            return res.status(400).json({
                error: "ValidationError",
                details: errors.array(),
            });
        }

        const {
            title, description, loaderUrl, hubId, gamePlatformId, tags,
            isPaid, purchaseUrl, hasKeySystem, keySystemUrl
        } = req.body;
        const ownerId = req.user.userId;

        // Custom Validation for Monetization
        if (isPaid === true || isPaid === 'true') {
            if (!hubId) {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Paid scripts must be linked to a Hub. Please select a Hub.",
                });
            }
            if (!purchaseUrl) {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Purchase URL is required for paid scripts.",
                });
            }
        }

        if (hasKeySystem === true || hasKeySystem === 'true') {
            if (!keySystemUrl) {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Key System URL is required when Key System is enabled.",
                });
            }
        }

        // 2. Handle Game — auto-validate via Roblox API
        let gameId = null;
        if (gamePlatformId) {
            const game = await resolveGame(gamePlatformId);
            if (game) {
                gameId = game.id;
            } else {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Invalid game ID/link. Could not find this game on Roblox.",
                });
            }
        }

        // 3. Handle File Upload (thumbnail)
        let thumbnailUrl = undefined;
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            thumbnailUrl = req.files.thumbnail[0].key;
        } else {
            return res.status(400).json({
                error: "ValidationError",
                message: "Thumbnail is required",
            });
        }

        // 4. Create Script (slug is auto-generated as random)
        const newScript = await scriptService.createScript({
            title,
            description,
            thumbnailUrl,
            loaderUrl,
            hubId,
            gameId,
            ownerId,
            isPaid: isPaid === true || isPaid === 'true',
            purchaseUrl,
            hasKeySystem: hasKeySystem === true || hasKeySystem === 'true',
            keySystemUrl,
        });

        // 5. Handle Tags
        let scriptTags = [];
        if (tags) {
            const tagNames = tags.split(",").map((t) => t.trim()).filter(Boolean);
            scriptTags = await tagService.setScriptTags(newScript.id, tagNames);
        }

        logger.info("Script created: %s by user %s (game: %s)", title, ownerId, gameId);

        res.status(201).json({
            success: true,
            message: "Script created successfully",
            data: { ...newScript, tags: scriptTags },
        });
    } catch (error) {
        logger.error("Create Script Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to create script",
        });
    }
};

/**
 * Update a script
 * PATCH /api/scripts/:id
 */
export const updateScript = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // 1. Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: "ValidationError",
                details: errors.array(),
            });
        }

        // 2. Check ownership
        const script = await scriptService.getScriptById(id);
        if (!script) {
            return res.status(404).json({
                error: "NotFound",
                message: "Script not found",
            });
        }

        if (script.owner_id !== userId) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You do not have permission to update this script",
            });
        }

        // 3. Handle File Upload & delete old thumbnail from S3
        let thumbnailUrl = undefined;
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            if (script.thumbnail_url) {
                await deleteS3Object(script.thumbnail_url);
            }
            thumbnailUrl = req.files.thumbnail[0].key;
        }

        // 4. Handle Game
        const {
            title, description, loaderUrl, gamePlatformId, tags, hubId,
            isPaid, purchaseUrl, hasKeySystem, keySystemUrl
        } = req.body;
        let gameId = undefined;
        if (gamePlatformId) {
            const game = await resolveGame(gamePlatformId);
            if (game) {
                gameId = game.id;
            } else {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Invalid game ID/link. Could not find this game on Roblox.",
                });
            }
        }

        // Validate Monetization correctness on update
        const parseEmpty = (val) => (val === "" || val === "null" || val === "undefined") ? null : val;

        if (isPaid === true || isPaid === 'true') {
            const finalHubId = parseEmpty(hubId) !== undefined ? parseEmpty(hubId) : script.hub_id;
            if (!finalHubId) {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Paid scripts must be linked to a Hub. This script is not linked to any Hub.",
                });
            }

            const finalPurchaseUrl = parseEmpty(purchaseUrl) !== undefined ? parseEmpty(purchaseUrl) : script.purchase_url;
            if (!finalPurchaseUrl) {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Purchase URL is required for paid scripts.",
                });
            }
        }

        if (hasKeySystem === true || hasKeySystem === 'true') {
            const finalKeyUrl = parseEmpty(keySystemUrl) !== undefined ? parseEmpty(keySystemUrl) : script.key_system_url;
            if (!finalKeyUrl) {
                return res.status(400).json({
                    error: "ValidationError",
                    message: "Key System URL is required.",
                });
            }
        }

        // 5. Update Script
        const updatedScript = await scriptService.updateScript(id, {
            title,
            description: parseEmpty(description),
            thumbnailUrl,
            loaderUrl: parseEmpty(loaderUrl),
            gameId,
            hubId: parseEmpty(hubId),
            isPaid: isPaid !== undefined ? (isPaid === true || isPaid === 'true') : undefined,
            purchaseUrl: parseEmpty(purchaseUrl),
            hasKeySystem: hasKeySystem !== undefined ? (hasKeySystem === true || hasKeySystem === 'true') : undefined,
            keySystemUrl: parseEmpty(keySystemUrl),
        });

        // 6. Handle Tags
        let scriptTags = [];
        if (tags !== undefined) {
            const tagNames = (tags || "").split(",").map((t) => t.trim()).filter(Boolean);
            scriptTags = await tagService.setScriptTags(id, tagNames);
        }

        logger.info("Script updated: %s by user %s", id, userId);

        res.json({
            success: true,
            message: "Script updated successfully",
            data: { ...(updatedScript || script), tags: scriptTags },
        });
    } catch (error) {
        logger.error("Update Script Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to update script",
        });
    }
};

/**
 * Get my scripts (with tags)
 * GET /api/scripts/me
 */
export const getMyScripts = async (req, res) => {
    try {
        const scripts = await scriptService.getScriptsByOwner(req.user.userId);

        // Attach tags to each script
        const scriptsWithTags = await Promise.all(
            scripts.map(async (script) => {
                const tags = await tagService.getTagsByScriptId(script.id);
                return { ...script, tags };
            })
        );

        res.json({
            success: true,
            data: scriptsWithTags,
        });
    } catch (error) {
        logger.error("Get My Scripts Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch scripts",
        });
    }
};

/**
 * Get all published scripts (with tags)
 * GET /api/scripts?page=1&limit=30
 */
export const getAllScripts = async (req, res) => {
    try {
        const { tag, query, hubId, sortBy, seed, page = 1, limit = 30 } = req.query;
        const userId = req.user?.userId || null;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

        const { rows: scripts, total } = await scriptService.getAllPublishedScripts({
            tag, query, userId, hubId, sortBy, seed,
            page: pageNum,
            limit: limitNum,
        });

        const scriptsWithTags = await Promise.all(
            scripts.map(async (script) => {
                const tags = await tagService.getTagsByScriptId(script.id);
                return { ...script, tags };
            })
        );

        res.json({
            success: true,
            data: scriptsWithTags,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasMore: pageNum * limitNum < total,
            },
        });
    } catch (error) {
        logger.error("Get All Scripts Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch scripts",
        });
    }
};

/**
 * Get trending scripts
 * GET /api/scripts/trending?period=today|week|month|all
 */
export const getTrendingScripts = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const userId = req.user?.userId || null;
        const scripts = await scriptService.getTrendingScripts({ period, userId });

        const scriptsWithTags = await Promise.all(
            scripts.map(async (script) => {
                const tags = await tagService.getTagsByScriptId(script.id);
                return { ...script, tags };
            })
        );

        res.json({
            success: true,
            data: scriptsWithTags,
        });
    } catch (error) {
        logger.error("Get Trending Scripts Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch trending scripts",
        });
    }
};

/**
 * Get script by slug
 * GET /api/scripts/slug/:slug
 */
export const getScriptBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        // Attempt to get user ID if token is present (middleware might not populate it for public routes unless we use a "tryAuth" middleware)
        // For now, let's assume if req.user exists, it's valid.
        const userId = req.user ? req.user.userId : null;

        const script = await scriptService.getScriptBySlug(slug, userId);

        if (!script) {
            return res.status(404).json({
                error: "NotFound",
                message: "Script not found",
            });
        }

        const tags = await tagService.getTagsByScriptId(script.id);

        res.json({
            success: true,
            data: { ...script, tags },
        });
    } catch (error) {
        logger.error("Get Script By Slug Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch script",
        });
    }
};

/**
 * Get script by ID
 * GET /api/scripts/:id
 */
export const getScriptById = async (req, res) => {
    try {
        const { id } = req.params;
        const script = await scriptService.getScriptById(id);

        if (!script) {
            return res.status(404).json({
                error: "NotFound",
                message: "Script not found",
            });
        }

        // Get tags
        const tags = await tagService.getTagsByScriptId(script.id);

        res.json({
            success: true,
            data: { ...script, tags },
        });
    } catch (error) {
        logger.error("Get Script By ID Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch script",
        });
    }
};

/**
 * Soft delete a script (set deleted_at)
 * DELETE /api/scripts/:id
 */
export const deleteScript = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Check ownership
        const script = await scriptService.getScriptById(id);
        if (!script) {
            return res.status(404).json({ error: "NotFound", message: "Script not found" });
        }
        if (script.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You do not own this script" });
        }

        await scriptService.softDeleteScript(id);

        res.json({
            success: true,
            message: "Script deleted successfully",
        });
    } catch (error) {
        logger.error("Delete Script Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete script" });
    }
};

/**
 * Record a view for a script
 * POST /api/scripts/:id/view
 */
export const recordView = async (req, res) => {
    try {
        const { id } = req.params;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Simple validation for ID format
        if (!id) return res.status(400).json({ error: "ValidationError", message: "Script ID is required" });

        const recorded = await scriptService.recordView(id, ipAddress);

        res.json({
            success: true,
            data: { recorded },
        });
    } catch (error) {
        logger.error("Record View Error: %o", error);
        // Don't fail the request significantly, just return false
        res.json({ success: false, data: { recorded: false } });
    }
};

/**
 * Record a copy event for a script
 * POST /api/scripts/:id/copy
 */
export const recordCopy = async (req, res) => {
    try {
        const { id } = req.params;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (!id) return res.status(400).json({ error: "ValidationError", message: "Script ID is required" });

        // Rate limit check (1 copy per minute per IP per script)
        // Key Identifier: copy_limit:${id}:${ipAddress} -> redis key: ratelimit:copy_limit:${id}:${ipAddress}
        const { exceeded } = await checkRateLimit(`copy_limit:${id}:${ipAddress}`, 1, 60);

        if (exceeded) {
            // Silently succeed without incrementing
            return res.json({ success: true, data: { copies: -1, message: "Rate limited" } });
        }

        const result = await scriptService.incrementCopies(id);

        res.json({
            success: true,
            data: { copies: result?.copies || 0 },
        });
    } catch (error) {
        logger.error("Record Copy Error: %o", error);
        res.json({ success: false, data: { copies: 0 } });
    }
};

/**
 * Toggle like for a script
 * POST /api/scripts/:id/like
 */
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await scriptService.toggleLike(id, userId);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error("Toggle Like Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to toggle like" });
    }
};

/**
 * Get comments for a script
 * GET /api/scripts/:id/comments
 */
export const getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await scriptService.getComments(id);

        res.json({
            success: true,
            data: comments,
        });
    } catch (error) {
        logger.error("Get Comments Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch comments" });
    }
};

/**
 * Post a comment
 * POST /api/scripts/:id/comments
 */
export const postComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user.userId;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "ValidationError", message: "Comment content is required" });
        }

        const comment = await scriptService.postComment(id, userId, content, parentId);

        // Fetch user details to return with comment
        // Or just return the basic comment and let frontend handle optimistically
        // Better to return basic structure or fetch minimal user info if possible. 
        // For now, service returns * which includes created_at. 
        // We can just return it. Frontend might need to refetch or we rely on the fact that the user knows who they are.

        res.status(201).json({
            success: true,
            data: comment,
        });
    } catch (error) {
        logger.error("Post Comment Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to post comment" });
    }
};

/**
 * Delete a comment
 * DELETE /api/scripts/:id/comments/:commentId
 */
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        await scriptService.deleteComment(commentId, userId);

        res.json({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        logger.error("Delete Comment Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete comment" });
    }
};
