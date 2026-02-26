import * as plansService from "./plans.service.js";
import logger from "../../utils/logger.js";

/**
 * Get user's plan and maximums
 * GET /api/plans/me
 */
export const getMyPlan = async (req, res) => {
    try {
        const data = await plansService.getUserPlanWithMaximums(req.user.userId);
        res.json({ success: true, data });
    } catch (error) {
        logger.error("Get plan error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch plan and maximums" });
    }
};
