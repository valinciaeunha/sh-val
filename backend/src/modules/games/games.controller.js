import * as gameService from "./games.service.js";
import { body, query, validationResult } from "express-validator";
import logger from "../../utils/logger.js";

/**
 * Validation for creating a game
 */
export const createGameValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Game name is required")
        .isLength({ min: 1, max: 150 })
        .withMessage("Game name must be between 1 and 150 characters"),
    body("gamePlatformId")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage("Game platform ID cannot exceed 100 characters"),
    body("platform")
        .optional()
        .trim()
        .isIn(["roblox", "other"])
        .withMessage("Platform must be roblox or other"),
];

/**
 * Create a game (or return existing by platform ID)
 * POST /api/games
 */
export const createGame = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "ValidationError", details: errors.array() });
        }

        const { name, gamePlatformId, platform } = req.body;

        let logoUrl = undefined;
        let bannerUrl = undefined;
        if (req.files) {
            if (req.files.logo && req.files.logo[0]) logoUrl = req.files.logo[0].key;
            if (req.files.banner && req.files.banner[0]) bannerUrl = req.files.banner[0].key;
        }

        const game = await gameService.findOrCreateGame({
            name,
            gamePlatformId,
            platform,
            logoUrl,
            bannerUrl,
        });

        logger.info("Game created/found: %s", game.name);

        res.status(201).json({ success: true, data: game });
    } catch (error) {
        logger.error("Create Game Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to create game" });
    }
};

/**
 * Get all games
 * GET /api/games
 */
export const getAllGames = async (req, res) => {
    try {
        const games = await gameService.getAllGames();
        res.json({ success: true, data: games });
    } catch (error) {
        logger.error("Get All Games Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch games" });
    }
};

/**
 * Search games
 * GET /api/games/search?q=
 */
export const searchGamesHandler = async (req, res) => {
    try {
        const q = req.query.q || "";
        if (q.length < 1) {
            return res.json({ success: true, data: [] });
        }
        const games = await gameService.searchGames(q);
        res.json({ success: true, data: games });
    } catch (error) {
        logger.error("Search Games Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to search games" });
    }
};

/**
 * Lookup a Roblox game by ID, URL, or share link
 * GET /api/games/lookup?q=
 * Always fetches fresh data from Roblox API and syncs DB
 */
export const lookupGame = async (req, res) => {
    try {
        const q = req.query.q || "";
        if (q.length < 1) {
            return res.status(400).json({ error: "ValidationError", message: "Game ID or link is required" });
        }

        // Always fetch fresh data from Roblox API
        const { lookupRobloxGame } = await import("../../utils/roblox.js");
        const robloxGame = await lookupRobloxGame(q);

        if (!robloxGame) {
            // Fallback: if Roblox API fails but game exists in DB, return DB data
            const fallback = await gameService.findByPlatformId(q.trim());
            if (fallback) {
                return res.json({ success: true, data: fallback, source: "database" });
            }
            return res.status(404).json({
                error: "NotFound",
                message: "Game not found on Roblox. Please check the ID or link.",
            });
        }

        const universeId = String(robloxGame.universeId);

        // Check if game exists in DB
        const existing = await gameService.findByPlatformId(universeId);

        let gameRecord;
        if (existing) {
            // Auto-update DB if name, logo, or banner changed
            const updates = {};
            if (robloxGame.name && robloxGame.name !== existing.name) {
                updates.name = robloxGame.name;
            }
            if (robloxGame.iconUrl && robloxGame.iconUrl !== existing.logo_url) {
                updates.logoUrl = robloxGame.iconUrl;
            }
            if (robloxGame.thumbnailUrl && robloxGame.thumbnailUrl !== existing.banner_url) {
                updates.bannerUrl = robloxGame.thumbnailUrl;
            }

            if (Object.keys(updates).length > 0) {
                gameRecord = await gameService.updateGame(existing.id, updates);
                logger.info("Game auto-updated: %s (%s) — fields: %s", existing.name, universeId, Object.keys(updates).join(", "));
            } else {
                gameRecord = existing;
            }
        } else {
            // New game — save to DB
            gameRecord = await gameService.createGame({
                name: robloxGame.name,
                gamePlatformId: universeId,
                platform: "roblox",
                logoUrl: robloxGame.iconUrl || null,
                bannerUrl: robloxGame.thumbnailUrl || null,
            });
            logger.info("Game auto-saved: %s (%s)", robloxGame.name, universeId);
        }

        // Return DB record + fresh real-time stats from Roblox
        res.json({
            success: true,
            source: existing ? "synced" : "roblox",
            data: {
                ...gameRecord,
                creator: robloxGame.creator,
                playing: robloxGame.playing,
                visits: robloxGame.visits,
            },
        });
    } catch (error) {
        logger.error("Lookup Game Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to lookup game" });
    }
};
/**
 * Get game by slug (with its scripts)
 * GET /api/games/slug/:slug
 */
export const getGameBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const game = await gameService.getGameBySlugWithScripts(slug);

        if (!game) {
            return res.status(404).json({
                error: "NotFound",
                message: "Game not found",
            });
        }

        res.json({ success: true, data: game });
    } catch (error) {
        logger.error("Get Game By Slug Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch game details" });
    }
};
