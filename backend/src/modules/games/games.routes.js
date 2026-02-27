import express from "express";
import * as gameController from "./games.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { imageUpload } from "../../middleware/upload.js";

const router = express.Router();

/**
 * @route   GET /api/games
 * @desc    Get all games
 * @access  Public
 */
router.get("/", gameController.getAllGames);

/**
 * @route   GET /api/games/lookup?q=
 * @desc    Lookup a game by Roblox ID, URL, or share link
 * @access  Public
 */
router.get("/lookup", gameController.lookupGame);

/**
 * @route   GET /api/games/search?q=
 * @desc    Search games by name
 * @access  Public
 */
router.get("/search", gameController.searchGamesHandler);

/**
 * @route   GET /api/games/slug/:slug
 * @desc    Get game by slug (with its scripts)
 * @access  Public
 */
router.get("/slug/:slug", gameController.getGameBySlug);

/**
 * @route   POST /api/games
 * @desc    Create a game (with optional logo/banner)
 * @access  Private
 */
router.post(
    "/",
    authenticate,
    (req, res, next) => {
        req.uploadFolder = "games";
        next();
    },
    imageUpload.fields([
        { name: "logo", maxCount: 1 },
        { name: "banner", maxCount: 1 },
    ]),
    gameController.createGameValidation,
    gameController.createGame
);

export default router;
