import * as executorService from "./executors.service.js";
import { body, validationResult } from "express-validator";
import logger from "../../utils/logger.js";

/**
 * Validation Rules
 */
export const createExecutorValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Executor name is required")
        .isLength({ min: 3, max: 50 })
        .withMessage("Executor name must be between 3 and 50 characters"),
    body("description")
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description cannot exceed 1000 characters"),
    body("website")
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_tld: false })
        .withMessage("Website must be a valid URL"),
    body("discord")
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_tld: false })
        .withMessage("Discord server must be a valid URL"),
    body("telegram")
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_tld: false })
        .withMessage("Telegram link must be a valid URL"),
    body("priceModel")
        .isIn(['Free', 'Keyless', 'Paid'])
        .withMessage("Invalid price model"),
    // validation for array fields is tricky with FormData. Sometimes comes as comma-separated
];

export const updateExecutorValidation = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage("Executor name must be between 3 and 50 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description cannot exceed 1000 characters"),
    body("website")
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_tld: false })
        .withMessage("Website must be a valid URL"),
    body("discord")
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_tld: false })
        .withMessage("Discord server must be a valid URL"),
    body("telegram")
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_tld: false })
        .withMessage("Telegram link must be a valid URL"),
    body("priceModel")
        .optional()
        .isIn(['Free', 'Keyless', 'Paid'])
        .withMessage("Invalid price model"),
];

/**
 * Create a new executor
 * POST /api/executors
 */
export const createExecutor = async (req, res) => {
    try {
        // 1. Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error("Executor Creation Validation Errors:", JSON.stringify(errors.array(), null, 2));
            return res.status(400).json({
                error: "ValidationError",
                details: errors.array(),
            });
        }

        const { name, description, website, discord, telegram, priceModel, version, downloadUrl, patchNotes } = req.body;

        // Arrays from FormData can be parsed nicely or sent as JSON strings. Multer doesn't auto-parse JSON strings from text fields.
        let platforms = [];
        let tags = [];
        try {
            platforms = req.body.platforms ? JSON.parse(req.body.platforms) : [];
            tags = req.body.tags ? JSON.parse(req.body.tags) : [];
        } catch (e) {
            // fallback if it's not JSON
            platforms = Array.isArray(req.body.platforms) ? req.body.platforms : [];
            tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        }

        const ownerId = req.user.userId; // From authenticate middleware

        // 1.5. Enforce 1 Executor Per User Limit
        const existingExecutors = await executorService.getMyExecutors(ownerId);
        if (existingExecutors && existingExecutors.length >= 1) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only create one executor per account."
            });
        }

        // 2. Generate Slug
        let slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        let uniqueSlug = slug;
        let counter = 1;
        while (await executorService.checkSlugExists(uniqueSlug)) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        slug = uniqueSlug;

        // 3. Handle File Uploads (S3)
        let bannerUrl = null;
        let logoUrl = null;

        if (req.files) {
            if (req.files.banner && req.files.banner[0]) {
                bannerUrl = req.files.banner[0].key;
            }
            if (req.files.logo && req.files.logo[0]) {
                logoUrl = req.files.logo[0].key;
            }
        }

        // 4. Create Executor listing
        const newExecutor = await executorService.createExecutor({
            name,
            slug,
            description,
            website,
            discord,
            telegram,
            platforms,
            priceModel,
            logoUrl,
            bannerUrl,
            tags,
            ownerId,
        });

        // 5. If version info was provided (Initial Version), create the version record
        if (version && downloadUrl) {
            await executorService.addVersion({
                executorId: newExecutor.id,
                version,
                downloadUrl,
                patchNotes: patchNotes || ""
            });
        }

        res.status(201).json({
            success: true,
            message: "Executor registered successfully and is pending approval.",
            data: newExecutor,
        });

    } catch (error) {
        logger.error("Create Executor Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to register executor",
        });
    }
};

/**
 * Get my executors
 * GET /api/executors/me
 */
export const getMyExecutors = async (req, res) => {
    try {
        const executors = await executorService.getMyExecutors(req.user.userId);
        res.json({
            success: true,
            data: executors
        });
    } catch (error) {
        logger.error("Get My Executors Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch executors"
        });
    }
}

/**
 * Get all active executors (public)
 * GET /api/executors
 */
export const getAllExecutors = async (req, res) => {
    try {
        const executors = await executorService.getAllExecutors();
        res.status(200).json({
            success: true,
            data: executors
        });
    } catch (error) {
        logger.error("Get All Executors Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch executors"
        });
    }
};

/**
 * Get executor detail by slug (public)
 * GET /api/executors/slug/:slug
 */
export const getExecutorBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const executor = await executorService.getExecutorBySlug(slug);

        if (!executor) {
            return res.status(404).json({
                error: "NotFound",
                message: "Executor not found"
            });
        }

        // If it's pending, only the owner can view it
        if (executor.status === "Pending") {
            const userId = req.user?.userId;
            if (!userId || userId !== executor.owner_id) {
                return res.status(404).json({
                    error: "NotFound",
                    message: "Executor not found or is pending approval"
                });
            }
        }

        // Fetch versions for this executor
        const versions = await executorService.getVersions(executor.id);

        res.json({
            success: true,
            data: {
                ...executor,
                versions
            }
        });
    } catch (error) {
        logger.error("Get Executor By Slug Error:", error);
        res.status(500).json({
            error: "ServerError",
            message: "Failed to fetch executor details"
        });
    }
};
/**
 * Add a new version release
 * POST /api/executors/:id/versions
 */
export const addVersion = async (req, res) => {
    try {
        const { id: slug } = req.params; // Assume frontend passes slug as ID
        const userId = req.user.userId;
        const { version, downloadUrl, patchNotes } = req.body;

        if (!version || !downloadUrl) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Version and download URL are required"
            });
        }

        // 1. Fetch executor and check ownership
        const executor = await executorService.getExecutorBySlug(slug);

        if (!executor) {
            return res.status(404).json({ error: "NotFound", message: "Executor not found" });
        }

        if (executor.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You don't have permission to add versions to this executor." });
        }

        // 2. Add the version
        const newVersion = await executorService.addVersion({
            executorId: executor.id,
            version,
            downloadUrl,
            patchNotes: patchNotes || ""
        });

        res.status(201).json({
            success: true,
            message: "Version release published successfully",
            data: newVersion
        });

    } catch (error) {
        logger.error("Add Version Error:", error);
        res.status(500).json({ error: "ServerError", message: "Failed to create executor" });
    }
};

/**
 * Update an executor
 * PATCH /api/executors/:id
 */
export const updateExecutor = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: "ValidationError",
                details: errors.array()
            });
        }

        const updateData = { ...req.body };

        if (req.body.platforms) {
            try {
                updateData.platforms = typeof req.body.platforms === 'string' ? JSON.parse(req.body.platforms) : req.body.platforms;
            } catch (e) {
                updateData.platforms = Array.isArray(req.body.platforms) ? req.body.platforms : [];
            }
        }

        if (req.body.tags) {
            try {
                updateData.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
            } catch (e) {
                updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
            }
        }

        if (req.files?.logo?.[0]) {
            updateData.logoUrl = req.files.logo[0].key; // Assuming S3 upload gets .key
        }
        if (req.files?.banner?.[0]) {
            updateData.bannerUrl = req.files.banner[0].key;
        }

        const updatedExecutor = await executorService.updateExecutor(id, updateData);

        res.json({
            success: true,
            message: "Executor updated successfully",
            data: updatedExecutor
        });

    } catch (error) {
        logger.error("Update Executor Error:", error);
        res.status(500).json({ error: "ServerError", message: "Failed to update executor" });
    }
};

/**
 * Update a specific version release
 * PATCH /api/executors/:id/versions/:versionId
 */
export const updateVersion = async (req, res) => {
    try {
        const { id, versionId } = req.params;
        const userId = req.user.userId;
        const { version, downloadUrl, patchNotes } = req.body;

        if (!version || !downloadUrl) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Version and download URL are required"
            });
        }

        // Fetch executor to check ownership
        const executor = await executorService.getExecutorById(id);

        if (!executor) {
            return res.status(404).json({ error: "NotFound", message: "Executor not found" });
        }

        if (executor.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You don't have permission to edit this executor's versions." });
        }

        // Update the version
        const updatedVersion = await executorService.updateVersion(versionId, {
            version,
            downloadUrl,
            patchNotes
        });

        if (!updatedVersion) {
            return res.status(404).json({ error: "NotFound", message: "Version not found" });
        }

        res.json({
            success: true,
            message: "Version updated successfully",
            data: updatedVersion
        });

    } catch (error) {
        logger.error("Update Version Error:", error);
        res.status(500).json({ error: "ServerError", message: "Failed to update version release" });
    }
};

/**
 * Delete a specific version release
 * DELETE /api/executors/:id/versions/:versionId
 */
export const deleteVersion = async (req, res) => {
    try {
        const { id, versionId } = req.params;
        const userId = req.user.userId;

        // Fetch executor to check ownership
        const executor = await executorService.getExecutorById(id);

        if (!executor) {
            return res.status(404).json({ error: "NotFound", message: "Executor not found" });
        }

        if (executor.owner_id !== userId) {
            return res.status(403).json({ error: "Forbidden", message: "You don't have permission to delete this executor's versions." });
        }

        const isDeleted = await executorService.deleteVersion(versionId);

        if (!isDeleted) {
            return res.status(404).json({ error: "NotFound", message: "Version not found" });
        }

        res.json({
            success: true,
            message: "Version deleted successfully"
        });

    } catch (error) {
        logger.error("Delete Version Error:", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete version release" });
    }
};
