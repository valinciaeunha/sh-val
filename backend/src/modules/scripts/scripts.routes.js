import express from "express";
import * as scriptController from "./scripts.controller.js";
import { authenticate, optionalAuth } from "../../middleware/auth.js";
import upload, { imageUpload } from "../../middleware/upload.js";

const router = express.Router();

// ... existing GET routes ...

/**
 * @route   GET /api/scripts
 * @desc    Get all published scripts
 * @access  Public
 */
router.get("/", optionalAuth, scriptController.getAllScripts);

/**
 * @route   GET /api/scripts/trending
 * @desc    Get trending scripts by period
 * @access  Public
 */
router.get("/trending", optionalAuth, scriptController.getTrendingScripts);



/**
 * @route   GET /api/scripts/slug/:slug
 * @desc    Get script by slug
 * @access  Public
 */
router.get("/slug/:slug", optionalAuth, scriptController.getScriptBySlug);

/**
 * @route   GET /api/scripts/me
 * @desc    Get current user's scripts
 * @access  Private
 */
router.get("/me", authenticate, scriptController.getMyScripts);

/**
 * @route   GET /api/scripts/:id
 * @desc    Get script by ID
 * @access  Public
 */
router.get("/:id", scriptController.getScriptById);

/**
 * @route   POST /api/scripts
 * @desc    Create a new script
 * @access  Private
 */
router.post(
    "/",
    authenticate,
    (req, res, next) => {
        req.uploadFolder = "scripts";
        next();
    },
    imageUpload.fields([
        { name: "thumbnail", maxCount: 1 },
    ]),
    scriptController.createScriptValidation,
    scriptController.createScript
);

/**
 * @route   PATCH /api/scripts/:id
 * @desc    Update a script
 * @access  Private
 */
router.patch(
    "/:id",
    authenticate,
    (req, res, next) => {
        req.uploadFolder = "scripts";
        next();
    },
    imageUpload.fields([
        { name: "thumbnail", maxCount: 1 },
    ]),
    scriptController.updateScriptValidation,
    scriptController.updateScript
);

/**
 * @route   DELETE /api/scripts/:id
 * @desc    Soft delete a script
 * @access  Private
 */
router.delete("/:id", authenticate, scriptController.deleteScript);

/**
 * @route   POST /api/scripts/:id/view
 * @desc    Record a view
 * @access  Public
 */
router.post("/:id/view", scriptController.recordView);

/**
 * @route   POST /api/scripts/:id/copy
 * @desc    Record a copy event
 * @access  Public
 */
router.post("/:id/copy", scriptController.recordCopy);

/**
 * @route   POST /api/scripts/:id/like
 * @desc    Toggle like
 * @access  Private
 */
router.post("/:id/like", authenticate, scriptController.toggleLike);

/**
 * @route   GET /api/scripts/:id/comments
 * @desc    Get comments
 * @access  Public
 */
router.get("/:id/comments", scriptController.getComments);

/**
 * @route   POST /api/scripts/:id/comments
 * @desc    Post a comment
 * @access  Private
 */
router.post("/:id/comments", authenticate, scriptController.postComment);

/**
 * @route   DELETE /api/scripts/:id/comments/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete("/:id/comments/:commentId", authenticate, scriptController.deleteComment);

export default router;
