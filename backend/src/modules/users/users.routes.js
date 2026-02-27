import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.get("/me/stats", authenticate, usersController.getDashboardStats);
router.get("/me/api-key", authenticate, usersController.getApiKey);
router.post("/me/api-key/generate", authenticate, usersController.generateApiKey);

router.get("/:username", usersController.getProfile);
router.get("/:username/scripts", usersController.getUserScripts);

export default router;
