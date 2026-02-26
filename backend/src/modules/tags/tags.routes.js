import express from "express";
import * as tagsController from "./tags.controller.js";

const router = express.Router();

/**
 * @route   GET /api/tags/search
 * @desc    Search for existing tags
 * @access  Public
 */
router.get("/search", tagsController.searchTags);

/**
 * @route   GET /api/tags
 * @desc    Get all tags
 * @access  Public
 */
router.get("/", tagsController.getAllTags);

export default router;
