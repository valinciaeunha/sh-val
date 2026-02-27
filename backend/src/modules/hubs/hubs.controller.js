import * as hubService from "./hubs.service.js";
import * as scriptService from "../scripts/scripts.service.js";
import { body, validationResult } from "express-validator";
import { deleteS3Object } from "../../utils/s3Delete.js";
import logger from "../../utils/logger.js";

/**
 * Validation Rules
 */
export const createHubValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Hub name is required")
        .isLength({ min: 3, max: 50 })
        .withMessage("Hub name must be between 3 and 50 characters"),
    body("description")
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
    body("discordServer")
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage("Discord server must be a valid URL"),
];

/**
 * Update Hub Validation Rules
 */
export const updateHubValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Hub name cannot be empty")
        .isLength({ min: 3, max: 50 })
        .withMessage("Hub name must be between 3 and 50 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
    body("discordServer")
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage("Discord server must be a valid URL"),
];

/**
 * Create a new hub
 * POST /api/hubs
 */
export const createHub = async (req, res) => {
    try {
        // 1. Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error("Hub Creation Validation Errors:", JSON.stringify(errors.array(), null, 2));
            return res.status(400).json({
                error: "ValidationError",
                details: errors.array(),
            });
        }

        const { name, description, discordServer } = req.body;
        const ownerId = req.user.userId; // From authenticate middleware

        // 1.5 Check Hub Limit (1 per user)
        const hasHub = await hubService.checkHubExistsForOwner(ownerId);
        if (hasHub) {
            return res.status(400).json({
                error: "LimitExceeded",
                message: "You can only create one hub.",
            });
        }

        // 2. Generate Slug
        let slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        // Ensure unique slug
        let uniqueSlug = slug;
        let counter = 1;
        while (await hubService.checkSlugExists(uniqueSlug)) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        slug = uniqueSlug;

        // 3. Handle File Uploads (S3)
        // Multer-S3 already uploaded files to S3 and populated req.files
        // User requested relative paths (keys) instead of full URLs
        let bannerUrl = null;
        let logoUrl = null;

        if (req.files) {
            if (req.files.banner && req.files.banner[0]) {
                // Use .key for relative path (e.g., "hubs/filename.png")
                bannerUrl = req.files.banner[0].key;
            }
            if (req.files.logo && req.files.logo[0]) {
                logoUrl = req.files.logo[0].key;
            }
        }

        // 4. Create Hub in DB
        const newHub = await hubService.createHub({
            name,
            slug,
            description,
            bannerUrl,
            logoUrl,
            logoUrl,
            ownerId,
            discordServer,
        });

        res.status(201).json({
            success: true,
            message: "Hub created successfully and is pending approval.",
            data: newHub,
        });

    } catch (error) {
        logger.error("Create Hub Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to create hub",
        });
    }
};

/**
 * Update a hub
 * PATCH /api/hubs/:id
 */
export const updateHub = async (req, res) => {
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

        // 2. Check ownership or admin
        const hub = await hubService.getHubById(id);
        if (!hub) {
            return res.status(404).json({
                error: "NotFound",
                message: "Hub not found",
            });
        }

        if (hub.owner_id !== userId) { // TODO: Add admin check later if needed
            return res.status(403).json({
                error: "Forbidden",
                message: "You do not have permission to update this hub",
            });
        }

        // 3. Handle File Uploads & delete old images from S3
        let bannerUrl = undefined;
        let logoUrl = undefined;

        if (req.files) {
            if (req.files.banner && req.files.banner[0]) {
                // Delete old banner from S3 if exists
                if (hub.banner_url) {
                    await deleteS3Object(hub.banner_url);
                }
                bannerUrl = req.files.banner[0].key;
            }
            if (req.files.logo && req.files.logo[0]) {
                // Delete old logo from S3 if exists
                if (hub.logo_url) {
                    await deleteS3Object(hub.logo_url);
                }
                logoUrl = req.files.logo[0].key;
            }
        }

        // 4. Update Hub
        const { name, description, discordServer } = req.body;

        let slug = undefined;
        if (name && name !== hub.name) {
            slug = name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");

            // simple uniqueness check logic reuse or just append id/checking if exists
            // For now, simpler approach: if name changes, slug changes. 
            // We should ensure uniqueness but let's assume conflicting slugs will fail DB constraint (if unique constraint exists)
            // or we reuse the checkSlugExists.

            let uniqueSlug = slug;
            let counter = 1;
            while (await hubService.checkSlugExists(uniqueSlug)) {
                // If it's the same hub, it's fine (but checkSlugExists usually checks ANY row)
                // If we implemented checkSlugExists correctly it returns true if ANY row has it.
                // We need to exclude current hub from check ideally, but `checkSlugExists` is simple select.
                // So if we update name to same name, slug is same, checkSlugExists returns true (for this hub).
                // But we are inside `if (name !== hub.name)` block, so name IS different.

                uniqueSlug = `${slug}-${counter}`;
                counter++;
            }
            slug = uniqueSlug;
        }

        const updatedHub = await hubService.updateHub(id, {
            name,
            slug,
            description,
            bannerUrl,
            logoUrl,
            discordServer,
        });

        res.json({
            success: true,
            message: "Hub updated successfully",
            data: updatedHub || hub,
        });

    } catch (error) {
        logger.error("Update Hub Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to update hub",
        });
    }
};

/**
 * Get my hubs
 * GET /api/hubs/me
 */
export const getMyHubs = async (req, res) => {
    try {
        const hubs = await hubService.getHubsByOwner(req.user.userId);
        res.json({
            success: true,
            data: hubs
        });
    } catch (error) {
        logger.error("Get My Hubs Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch hubs"
        });
    }
}

/**
 * Get all active hubs (public)
 * GET /api/hubs
 */
export const getAllHubs = async (req, res) => {
    try {
        const hubs = await hubService.getAllActiveHubs();
        res.status(200).json({
            success: true,
            data: hubs
        });
    } catch (error) {
        logger.error("Get All Hubs Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch hubs"
        });
    }
};

/**
 * Get hub detail by slug (public)
 * GET /api/hubs/slug/:slug
 */
export const getHubBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const hub = await hubService.getHubBySlug(slug);

        if (!hub || !["active", "suspended"].includes(hub.status)) {
            return res.status(404).json({
                error: "NotFound",
                message: "Hub not found or is not active"
            });
        }

        // Fetch scripts for this hub
        const scripts = await scriptService.getScriptsByHub(hub.id);

        res.json({
            success: true,
            data: {
                ...hub,
                scripts
            }
        });
    } catch (error) {
        logger.error("Get Hub By Slug Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch hub details"
        });
    }
};

/**
 * Add script to hub
 * POST /api/hubs/:id/scripts/:scriptId
 */
export const addScriptToHub = async (req, res) => {
    try {
        const { id, scriptId } = req.params;
        const userId = req.user.userId;

        // 1. Check hub exists and user owns it
        const hub = await hubService.getHubById(id);
        if (!hub) {
            return res.status(404).json({ error: "NotFound", message: "Hub not found" });
        }
        if (hub.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You do not own this hub" });
        }

        // 2. Check script exists and user owns it
        const script = await scriptService.getScriptById(scriptId);
        if (!script) {
            return res.status(404).json({ error: "NotFound", message: "Script not found" });
        }
        if (script.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You do not own this script" });
        }

        // 3. Add script to hub
        const updated = await hubService.addScriptToHub(id, scriptId);

        res.json({
            success: true,
            message: "Script added to hub",
            data: updated
        });
    } catch (error) {
        logger.error("Add Script to Hub Error:", error);
        res.status(500).json({ error: "ServerError", message: "Failed to add script to hub" });
    }
};

/**
 * Remove script from hub
 * DELETE /api/hubs/:id/scripts/:scriptId
 */
export const removeScriptFromHub = async (req, res) => {
    try {
        const { id, scriptId } = req.params;
        const userId = req.user.userId;

        // 1. Check hub exists and user owns it
        const hub = await hubService.getHubById(id);
        if (!hub) {
            return res.status(404).json({ error: "NotFound", message: "Hub not found" });
        }
        if (hub.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You do not own this hub" });
        }

        // 2. Remove script from hub (just set hub_id = NULL)
        const updated = await hubService.removeScriptFromHub(scriptId);

        res.json({
            success: true,
            message: "Script removed from hub",
            data: updated
        });
    } catch (error) {
        logger.error("Remove Script from Hub Error:", error);
        res.status(500).json({ error: "ServerError", message: "Failed to remove script from hub" });
    }
};

/**
 * Get scripts belonging to a hub (for hub owner management)
 * GET /api/hubs/:id/scripts
 */
export const getHubScripts = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Check hub ownership
        const hub = await hubService.getHubById(id);
        if (!hub) {
            return res.status(404).json({ error: "NotFound", message: "Hub not found" });
        }
        if (hub.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You do not own this hub" });
        }

        const scripts = await hubService.getHubScripts(id);

        res.json({
            success: true,
            data: scripts
        });
    } catch (error) {
        logger.error("Get Hub Scripts Error:", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch hub scripts" });
    }
};
