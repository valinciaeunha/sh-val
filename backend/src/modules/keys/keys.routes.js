import express from "express";
import * as keysController from "./keys.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's scripts for generate modal
router.get("/scripts", keysController.getUserScripts);

// Get key analytics
router.get("/stats", keysController.getKeyStats);

// Get security settings
router.get("/settings", keysController.getSettings);

// Update security settings
router.put("/settings", keysController.updateSettings);

// Get user's keys (paginated)
router.get("/me", keysController.getMyKeys);

// Generate new keys
router.post(
    "/generate",
    keysController.generateKeysValidation,
    keysController.generateKeys
);

// Get single key with devices
router.get("/:id", keysController.getKeyById);

// Revoke a key
router.patch("/:id/revoke", keysController.revokeKey);

// Delete a key
router.delete("/:id", keysController.deleteKey);

// Revoke a device from a key
router.delete("/:id/devices/:deviceId", keysController.revokeDevice);

export default router;
