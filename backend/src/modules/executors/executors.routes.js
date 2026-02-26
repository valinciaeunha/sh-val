import express from "express";
import * as executorController from "./executors.controller.js";
import { authenticate, optionalAuth } from "../../middleware/auth.js";
import { imageUpload } from "../../middleware/upload.js";

const router = express.Router();

/**
 * Public Routes
 */
// Get all active executors
router.get("/", executorController.getAllExecutors);

// Get single executor by slug (including versions)
router.get("/slug/:slug", optionalAuth, executorController.getExecutorBySlug);

/**
 * Protected Routes (Requires Authentication)
 */
// Get user's own executors
router.get("/me", authenticate, executorController.getMyExecutors);

// Create a new executor listing
router.post(
    "/",
    authenticate,
    (req, res, next) => {
        req.uploadFolder = "executors";
        next();
    },
    imageUpload.fields([
        { name: "logo", maxCount: 1 },
        { name: "banner", maxCount: 1 },
    ]),
    executorController.createExecutorValidation,
    executorController.createExecutor
);

// Update an executor listing
router.patch(
    "/:id",
    authenticate,
    (req, res, next) => {
        req.uploadFolder = "executors";
        next();
    },
    imageUpload.fields([
        { name: "logo", maxCount: 1 },
        { name: "banner", maxCount: 1 },
    ]),
    executorController.updateExecutorValidation,
    executorController.updateExecutor
);

// Add a new version release to an executor
router.post(
    "/:id/versions",
    authenticate,
    executorController.addVersion
);

// Update a specific version release
router.patch(
    "/:id/versions/:versionId",
    authenticate,
    executorController.updateVersion
);

// Delete a specific version release
router.delete(
    "/:id/versions/:versionId",
    authenticate,
    executorController.deleteVersion
);

export default router;
