import express from "express";
import * as deploymentsController from "./deployments.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get deployment stats
router.get("/stats", deploymentsController.getDeploymentStats);

// Get user's deployments (paginated)
router.get("/me", deploymentsController.getMyDeployments);

// Create new deployment
router.post(
    "/",
    deploymentsController.deploymentValidation,
    deploymentsController.createDeployment
);

// Upload physical file
import upload from "../../middleware/upload.js";
router.post(
    "/upload",
    deploymentsController.checkDeploymentQuota,
    (req, res, next) => {
        const shortUserId = req.user.userId.substring(0, 8);
        req.uploadFolder = `v1/${shortUserId}`;
        next();
    },
    upload.single("file"),
    deploymentsController.uploadDeployment
);

// Get single deployment with content
router.get("/:id", deploymentsController.getDeploymentById);

// Update deployment
router.put("/:id", deploymentsController.updateDeployment);

// Delete deployment
router.delete("/:id", deploymentsController.deleteDeployment);



export default router;
