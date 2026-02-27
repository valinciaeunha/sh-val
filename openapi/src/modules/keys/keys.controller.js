import * as keysService from "./keys.service.js";
import { body, validationResult } from "express-validator";
import logger from "../../utils/logger.js";

/**
 * Validation rules for key validation
 */
export const validateKeyValidation = [
    body("key").trim().notEmpty().withMessage("Key is required"),
    body("scriptId").isUUID().withMessage("Script ID is required and must be a valid UUID"),
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



