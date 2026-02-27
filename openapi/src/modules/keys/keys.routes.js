import express from "express";
import * as keysController from "./keys.controller.js";

const router = express.Router();

// Validate a license key
router.post(
    "/validate",
    keysController.validateKeyValidation,
    keysController.validateKey
);

export default router;

