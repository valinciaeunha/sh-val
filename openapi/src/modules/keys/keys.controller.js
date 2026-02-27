import * as keysService from "./keys.service.js";
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
 * Validation rules for key validation
 */
export const validateKeyValidation = [
    body("key").trim().notEmpty().withMessage("Key is required"),
    body("scriptId").optional().isUUID().withMessage("Script ID must be a valid UUID"),
    body("hwid").optional().trim().isLength({ max: 128 }).withMessage("HWID must be under 128 characters"),
];

/**
 * Validate a license key
 * POST /api/v2/keys/validate
 */
export const validateKey = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "ValidationError", details: errors.array() });
        }

        const { key, scriptId, hwid } = req.body;

        const result = await keysService.validateKey({
            keyValue: key,
            scriptId: scriptId || null,
            hwid: hwid || null,
        });

        logger.info(`Key validation: "${key.substring(0, 10)}..." → ${result.valid ? "VALID" : "INVALID"}`);

        const statusCode = result.valid ? 200 : 403;
        res.status(statusCode).json({
            success: result.valid,
            valid: result.valid,
            message: result.message,
            ...(result.key && { data: result.key }),
        });
    } catch (error) {
        logger.error("Validate key error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to validate key" });
    }
};



