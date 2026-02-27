import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as adminController from "./admin.controller.js";

const router = Router();

/**
 * Middleware: only users with the 'admin' role may proceed
 */
const requireAdmin = (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.includes("admin")) {
        return res.status(403).json({
            error: "Forbidden",
            message: "Admin role required",
        });
    }
    next();
};

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.updateUser);
router.patch("/users/:id/status", adminController.setUserStatus);
router.patch("/users/:id/roles", adminController.setUserRoles);
router.get("/scripts", adminController.getScripts);
router.delete("/scripts/:id", adminController.deleteScript);
router.patch("/scripts/:id/status", adminController.updateScriptStatus);
router.get("/deployments", adminController.getDeployments);
router.delete("/deployments/:id", adminController.deleteDeployment);
router.get("/keys", adminController.getKeys);
router.delete("/keys/:id", adminController.deleteKey);
router.get("/hubs", adminController.getHubs);
router.delete("/hubs/:id", adminController.deleteHub);
router.patch("/hubs/:id/status", adminController.updateHubStatus);
router.patch("/hubs/:id/owner", adminController.changeHubOwner);

router.get("/executors", adminController.getExecutors);
router.patch("/executors/:id/status", adminController.updateExecutorStatus);
router.patch("/executors/:id/owner", adminController.changeExecutorOwner);

router.get("/plans", adminController.getPlans);
router.patch("/plans/:id", adminController.updatePlan);

export default router;
