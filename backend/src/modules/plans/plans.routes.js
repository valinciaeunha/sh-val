import express from "express";
import * as plansController from "./plans.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// Get current user's plan and credits
router.get("/me", plansController.getMyPlan);

export default router;
