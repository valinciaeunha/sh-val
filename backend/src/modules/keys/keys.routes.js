import express from "express";
import * as keysController from "./keys.controller.js";
import * as publickeyService from "./publickey.service.js";
import { authenticate } from "../../middleware/auth.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// ── Public routes (no auth) ──────────────────────────────────────────────────

// Get script info + getkey settings for public page
router.get("/public/script/:slug", async (req, res) => {
    try {
        const info = await publickeyService.getPublicScriptInfo(req.params.slug);
        if (!info) {
            return res.status(404).json({ error: "NotFound", message: "Script not found or Get Key not enabled" });
        }
        res.json({ success: true, data: info });
    } catch (error) {
        logger.error("Public script info error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch script info" });
    }
});

// Start a getkey session
router.post("/public/start-session", async (req, res) => {
    try {
        const { scriptSlug } = req.body;
        if (!scriptSlug) {
            return res.status(400).json({ error: "ValidationError", message: "scriptSlug is required" });
        }

        const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
        const deviceId = req.headers["x-device-id"];
        const result = await publickeyService.startSession(scriptSlug, ip, deviceId);

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        const msg = error.message || "";
        if (msg.includes("Rate limit")) {
            return res.status(429).json({ error: "RateLimited", message: msg });
        }
        if (msg.includes("not found") || msg.includes("not enabled")) {
            return res.status(404).json({ error: "NotFound", message: msg });
        }
        logger.error("Public start-session error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to start session" });
    }
});

// Complete an ad checkpoint
router.post("/public/complete-checkpoint", async (req, res) => {
    try {
        const { sessionToken, checkpointIndex } = req.body;
        if (!sessionToken || checkpointIndex === undefined) {
            return res.status(400).json({ error: "ValidationError", message: "sessionToken and checkpointIndex are required" });
        }

        const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
        const deviceId = req.headers["x-device-id"];
        const result = await publickeyService.completeCheckpoint(sessionToken, checkpointIndex, ip, deviceId);

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("Public complete-checkpoint error: %o", error);
        res.status(400).json({ error: "BadRequest", message: error.message || "Failed to complete checkpoint" });
    }
});

// Verify Turnstile captcha
router.post("/public/verify-captcha", async (req, res) => {
    try {
        const { sessionToken, turnstileToken } = req.body;
        if (!sessionToken || !turnstileToken) {
            return res.status(400).json({ error: "ValidationError", message: "sessionToken and turnstileToken are required" });
        }

        const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
        const deviceId = req.headers["x-device-id"];
        const result = await publickeyService.verifyCaptcha(sessionToken, turnstileToken, ip, deviceId);

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("Public verify-captcha error: %o", error);
        res.status(400).json({ error: "BadRequest", message: error.message || "Failed to verify captcha" });
    }
});

// Get session info
router.get("/public/session/:token", async (req, res) => {
    try {
        const deviceId = req.headers["x-device-id"];
        const result = await publickeyService.getSessionInfo(req.params.token, deviceId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: "BadRequest", message: error.message || "Session not found" });
    }
});

// Generate a public key after completing checkpoints
router.post("/public/getkey", async (req, res) => {
    try {
        const { sessionToken } = req.body;
        if (!sessionToken) {
            return res.status(400).json({ error: "ValidationError", message: "sessionToken is required" });
        }

        const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
        const deviceId = req.headers["x-device-id"];
        const result = await publickeyService.generatePublicKey(sessionToken, ip, deviceId);

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        const msg = error.message || "";
        if (msg.includes("Rate limit")) {
            return res.status(429).json({ error: "RateLimited", message: msg });
        }
        logger.error("Public getkey error: %o", error);
        res.status(400).json({ error: "BadRequest", message: msg || "Failed to generate key" });
    }
});

// ── Authenticated routes ─────────────────────────────────────────────────────
router.use(authenticate);

// Get user's scripts for generate modal
router.get("/scripts", keysController.getUserScripts);

// Get key analytics
router.get("/stats", keysController.getKeyStats);

// Get security settings
router.get("/settings", keysController.getSettings);

// Update security settings
router.put("/settings", keysController.updateSettings);

// Get Key system settings (per-user ad config)
router.get("/getkey-settings", keysController.getGetkeySettings);
router.put("/getkey-settings", keysController.updateGetkeySettings);

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
