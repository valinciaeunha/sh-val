import express from "express";
import * as keysController from "./keys.controller.js";
import { authenticateApiKey } from "../../middleware/auth.js";

const router = express.Router();

// Generate new keys via Developer API (Requires API Key)
router.post(
    "/generate",
    authenticateApiKey,
    keysController.generateKeysValidation,
    keysController.generateKeys
);

// Validate a license key
router.post(
    "/validate",
    keysController.validateKeyValidation,
    keysController.validateKey
);

export default router;

