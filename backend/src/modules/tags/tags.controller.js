import * as tagsService from "./tags.service.js";
import logger from "../../utils/logger.js";

/**
 * Search tags
 * GET /api/tags/search?q=
 */
export const searchTags = async (req, res) => {
    try {
        const q = req.query.q || "";
        const tags = await tagsService.searchTags(q);
        res.json({
            success: true,
            data: tags
        });
    } catch (error) {
        logger.error("Search Tags Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to search tags"
        });
    }
};

/**
 * Get all tags
 * GET /api/tags
 */
export const getAllTags = async (req, res) => {
    try {
        const tags = await tagsService.getAllTags();
        res.json({
            success: true,
            data: tags
        });
    } catch (error) {
        logger.error("Get All Tags Error: %o", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to get tags"
        });
    }
};
