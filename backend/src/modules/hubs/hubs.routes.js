import express from "express";
import * as hubController from "./hubs.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { imageUpload } from "../../middleware/upload.js";

const router = express.Router();


router.get("/", hubController.getAllHubs);

/**
 * @route   POST /api/hubs
 * @desc    Create a new hub
 * @access  Private
 */
router.post(
    "/",
    authenticate,
    // Configure upload to handle 'banner' and 'logo' fields
    // Files will be uploaded to S3 directly via middleware
    (req, res, next) => {
        // Modify upload folder dynamic logic if needed here, 
        // but multer-s3 setup in upload.js handles it generally.
        // We can rely on default logic or improve upload.js to handle subfolders better.
        // For now, default flat structure or date-based is fine.
        // To strictly put in 'scripthub/hubs/', we should have updated upload.js
        // But upload.js uses `req.uploadFolder` if present.
        req.uploadFolder = "hubs";
        next();
    },
    imageUpload.fields([
        { name: "banner", maxCount: 1 },
        { name: "logo", maxCount: 1 },
    ]),
    hubController.createHubValidation,
    hubController.createHub
);

/**
 * @route   PATCH /api/hubs/:id
 * @desc    Update a hub
 * @access  Private
 */
router.patch(
    "/:id",
    authenticate,
    // Configure upload to handle 'banner' and 'logo' fields
    (req, res, next) => {
        req.uploadFolder = "hubs";
        next();
    },
    imageUpload.fields([
        { name: "banner", maxCount: 1 },
        { name: "logo", maxCount: 1 },
    ]),
    hubController.updateHubValidation,
    hubController.updateHub
);

router.get("/me", authenticate, hubController.getMyHubs);

/**
 * @route   GET /api/hubs/slug/:slug
 * @desc    Get hub detail by slug
 * @access  Public
 */
router.get("/slug/:slug", hubController.getHubBySlug);

/**
 * @route   GET /api/hubs/:id/scripts
 * @desc    Get scripts belonging to a hub (owner only)
 * @access  Private
 */
router.get("/:id/scripts", authenticate, hubController.getHubScripts);

/**
 * @route   POST /api/hubs/:id/scripts/:scriptId
 * @desc    Add a script to a hub
 * @access  Private
 */
router.post("/:id/scripts/:scriptId", authenticate, hubController.addScriptToHub);

/**
 * @route   DELETE /api/hubs/:id/scripts/:scriptId
 * @desc    Remove a script from a hub
 * @access  Private
 */
router.delete("/:id/scripts/:scriptId", authenticate, hubController.removeScriptFromHub);

export default router;
