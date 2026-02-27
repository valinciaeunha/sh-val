import * as keysService from "./keys.service.js";
import * as getkeyService from "../admin/getkey.service.js";
import * as plansService from "../plans/plans.service.js";
import { body, validationResult } from "express-validator";
import logger from "../../utils/logger.js";

/**
 * Validation rules for key generation
 */
export const generateKeysValidation = [
    body("scriptId").isUUID().withMessage("Valid script ID is required"),
    body("type").isIn(["lifetime", "timed", "device_locked"]).withMessage("Invalid key type"),
    body("maxDevices").isInt({ min: 1, max: 10 }).withMessage("Max devices must be between 1 and 10"),
    body("quantity").isInt({ min: 1, max: 10000 }).withMessage("Quantity must be between 1 and 10,000"),
    body("expiresInDays").optional().isInt({ min: 1, max: 3650 }).withMessage("Expiry must be between 1 and 3650 days"),
    body("note").optional().trim().isLength({ max: 200 }).withMessage("Note must be under 200 characters"),
];

/**
 * Generate new license keys
 * POST /api/keys/generate
 */
export const generateKeys = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "ValidationError", details: errors.array() });
        }

        const { scriptId, type, maxDevices, quantity, expiresInDays, note } = req.body;
        const requestedQuantity = quantity || 1;

        // Verify quota limits first
        try {
            await plansService.verifyKeyQuota(req.user.userId, requestedQuantity);
        } catch (quotaError) {
            return res.status(403).json({ error: "QuotaExceeded", message: quotaError.message });
        }

        // Calculate expiry date
        let expiresAt = null;
        if (type === "timed" && expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        const keys = await keysService.generateKeys({
            scriptId,
            ownerId: req.user.userId,
            type,
            maxDevices: maxDevices || 1,
            expiresAt,
            note,
            quantity: requestedQuantity,
        });

        logger.info(`User ${req.user.userId} generated ${keys.length} keys for script ${scriptId}`);

        res.status(201).json({
            success: true,
            data: keys,
            message: `${keys.length} key(s) generated successfully`,
        });
    } catch (error) {
        logger.error("Generate keys error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to generate keys" });
    }
};

/**
 * Get user's keys (paginated)
 * GET /api/keys/me
 */
export const getMyKeys = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, scriptId } = req.query;

        const result = await keysService.getMyKeys(req.user.userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            scriptId,
        });

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("Get keys error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch keys" });
    }
};

/**
 * Get key analytics
 * GET /api/keys/stats
 */
export const getKeyStats = async (req, res) => {
    try {
        const stats = await keysService.getKeyStats(req.user.userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error("Get key stats error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch key stats" });
    }
};

/**
 * Get a single key with devices
 * GET /api/keys/:id
 */
export const getKeyById = async (req, res) => {
    try {
        const key = await keysService.getKeyById(req.params.id);
        if (!key) {
            return res.status(404).json({ error: "NotFound", message: "Key not found" });
        }
        // Verify ownership
        if (key.owner_id !== req.user.userId) {
            return res.status(403).json({ error: "Forbidden", message: "Not authorized" });
        }
        res.json({ success: true, data: key });
    } catch (error) {
        logger.error("Get key error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch key" });
    }
};

/**
 * Revoke a key
 * PATCH /api/keys/:id/revoke
 */
export const revokeKey = async (req, res) => {
    try {
        const key = await keysService.revokeKey(req.params.id, req.user.userId);
        if (!key) {
            return res.status(404).json({ error: "NotFound", message: "Key not found or not authorized" });
        }
        res.json({ success: true, data: key, message: "Key revoked successfully" });
    } catch (error) {
        logger.error("Revoke key error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to revoke key" });
    }
};

/**
 * Delete a key
 * DELETE /api/keys/:id
 */
export const deleteKey = async (req, res) => {
    try {
        const deleted = await keysService.deleteKey(req.params.id, req.user.userId);
        if (!deleted) {
            return res.status(404).json({ error: "NotFound", message: "Key not found or not authorized" });
        }
        res.json({ success: true, message: "Key deleted successfully" });
    } catch (error) {
        logger.error("Delete key error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete key" });
    }
};

/**
 * Revoke a device
 * DELETE /api/keys/:id/devices/:deviceId
 */
export const revokeDevice = async (req, res) => {
    try {
        const deleted = await keysService.revokeDevice(req.params.deviceId, req.user.userId);
        if (!deleted) {
            return res.status(404).json({ error: "NotFound", message: "Device not found or not authorized" });
        }
        res.json({ success: true, message: "Device revoked successfully" });
    } catch (error) {
        logger.error("Revoke device error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to revoke device" });
    }
};

/**
 * Get security settings
 * GET /api/keys/settings
 */
export const getSettings = async (req, res) => {
    try {
        const settings = await keysService.getSettings(req.user.userId);
        res.json({ success: true, data: settings });
    } catch (error) {
        logger.error("Get settings error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch settings" });
    }
};

/**
 * Update security settings
 * PUT /api/keys/settings
 */
export const updateSettings = async (req, res) => {
    try {
        const { deviceLockEnabled, maxDevicesPerKey, rateLimitingEnabled, autoExpireEnabled, hwidBlacklistEnabled } = req.body;

        const settings = await keysService.updateSettings(req.user.userId, {
            deviceLockEnabled,
            maxDevicesPerKey,
            rateLimitingEnabled,
            autoExpireEnabled,
            hwidBlacklistEnabled,
        });

        res.json({ success: true, data: settings, message: "Settings updated" });
    } catch (error) {
        logger.error("Update settings error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to update settings" });
    }
};

/**
 * Get user's scripts for generate modal dropdown
 * GET /api/keys/scripts
 */
export const getUserScripts = async (req, res) => {
    try {
        const scripts = await keysService.getUserScripts(req.user.userId);
        res.json({ success: true, data: scripts });
    } catch (error) {
        logger.error("Get user scripts error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch scripts" });
    }
};

/**
 * Get user's Get Key system settings
 * GET /api/keys/getkey-settings
 */
export const getGetkeySettings = async (req, res) => {
    try {
        const settings = await getkeyService.getGetkeySettings(req.user.userId);
        res.json({ success: true, data: settings });
    } catch (error) {
        logger.error("Get getkey settings error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch Get Key settings" });
    }
};

/**
 * Update user's Get Key system settings
 * PUT /api/keys/getkey-settings
 */
export const updateGetkeySettings = async (req, res) => {
    try {
        const settings = await getkeyService.updateGetkeySettings(req.user.userId, req.body);
        res.json({ success: true, data: settings, message: "Get Key settings updated" });
    } catch (error) {
        logger.error("Update getkey settings error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to update Get Key settings" });
    }
};
