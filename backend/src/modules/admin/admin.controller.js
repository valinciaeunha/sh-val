import * as adminService from "./admin.service.js";
import logger from "../../utils/logger.js";

/**
 * GET /api/admin/stats
 */
export const getStats = async (req, res) => {
    try {
        const stats = await adminService.getAdminStats();
        res.json({
            success: true,
            data: {
                totalUsers: stats.total_users,
                totalScripts: stats.total_scripts,
                totalDeployments: stats.total_deployments,
                totalKeys: stats.total_keys,
            },
        });
    } catch (error) {
        logger.error("Admin getStats error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch admin stats" });
    }
};

/**
 * GET /api/admin/users?limit=50&offset=0&search=
 */
export const getUsers = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = (req.query.search || "").trim();

        const { users, total } = await adminService.getAdminUsers({ limit, offset, search });

        res.json({
            success: true,
            data: { users, total, limit, offset },
        });
    } catch (error) {
        logger.error("Admin getUsers error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch users" });
    }
};

/**
 * PATCH /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
    try {
        const user = await adminService.updateUser(req.params.id, req.body);
        res.json({ success: true, data: user });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: 'Error', message: error.message || 'Failed to update user' });
    }
};

/**
 * PATCH /api/admin/users/:id/status
 */
export const setUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await adminService.setUserStatus(req.params.id, status);
        res.json({ success: true, data: user });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: 'Error', message: error.message || 'Failed to update status' });
    }
};

/**
 * PATCH /api/admin/users/:id/roles
 */
export const setUserRoles = async (req, res) => {
    try {
        const { roles } = req.body;
        if (!Array.isArray(roles)) return res.status(400).json({ error: 'BadRequest', message: 'roles must be an array' });
        const result = await adminService.setUserRoles(req.params.id, roles);
        res.json({ success: true, data: result });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: 'Error', message: error.message || 'Failed to update roles' });
    }
};

/**
 * GET /api/admin/scripts
 */
export const getScripts = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();
        const { scripts, total } = await adminService.getAdminScripts({ limit, offset, search, status });
        res.json({ success: true, data: { scripts, total, limit, offset } });
    } catch (error) {
        logger.error('Admin getScripts error: %o', error);
        res.status(500).json({ error: 'ServerError', message: 'Failed to fetch scripts' });
    }
};

/**
 * DELETE /api/admin/scripts/:id
 */
export const deleteScript = async (req, res) => {
    try {
        const result = await adminService.deleteScript(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to delete script' });
    }
};

/**
 * PATCH /api/admin/scripts/:id/status
 */
export const updateScriptStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const script = await adminService.updateScriptStatus(req.params.id, status);
        res.json({ success: true, data: script });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to update script status' });
    }
};

/** GET /api/admin/deployments */
export const getDeployments = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();
        const { deployments, total } = await adminService.getAdminDeployments({ limit, offset, search, status });
        res.json({ success: true, data: { deployments, total, limit, offset } });
    } catch (error) {
        logger.error('Admin getDeployments error: %o', error);
        res.status(500).json({ error: 'ServerError', message: 'Failed to fetch deployments' });
    }
};

/** DELETE /api/admin/deployments/:id */
export const deleteDeployment = async (req, res) => {
    try {
        const result = await adminService.deleteDeployment(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to delete deployment' });
    }
};

/** GET /api/admin/keys */
export const getKeys = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();
        const { keys, total } = await adminService.getAdminKeys({ limit, offset, search, status });
        res.json({ success: true, data: { keys, total, limit, offset } });
    } catch (error) {
        logger.error('Admin getKeys error: %o', error);
        res.status(500).json({ error: 'ServerError', message: 'Failed to fetch keys' });
    }
};

/** DELETE /api/admin/keys/:id */
export const deleteKey = async (req, res) => {
    try {
        const result = await adminService.deleteKey(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to delete key' });
    }
};

/** GET /api/admin/hubs */
export const getHubs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();
        const { hubs, total } = await adminService.getAdminHubs({ limit, offset, search, status });
        res.json({ success: true, data: { hubs, total, limit, offset } });
    } catch (error) {
        logger.error('Admin getHubs error: %o', error);
        res.status(500).json({ error: 'ServerError', message: 'Failed to fetch hubs' });
    }
};

/** DELETE /api/admin/hubs/:id */
export const deleteHub = async (req, res) => {
    try {
        const result = await adminService.deleteHub(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to delete hub' });
    }
};

/** PATCH /api/admin/hubs/:id/status */
export const updateHubStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const hub = await adminService.updateHubStatus(req.params.id, status);
        res.json({ success: true, data: hub });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to update hub status' });
    }
};

/** GET /api/admin/executors */
export const getExecutors = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();
        const { data, total } = await adminService.getAdminExecutors({ limit, offset, search, status });
        res.json({ success: true, data: { executors: data, total, limit, offset } });
    } catch (error) {
        logger.error('Admin getExecutors error: %o', error);
        res.status(500).json({ error: 'ServerError', message: 'Failed to fetch executors' });
    }
};

/** PATCH /api/admin/executors/:id/status */
export const updateExecutorStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const executor = await adminService.updateExecutorStatus(req.params.id, status);
        res.json({ success: true, data: executor });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to update executor status' });
    }
};

/** GET /api/admin/plans */
export const getPlans = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search = (req.query.search || '').trim();
        const planType = (req.query.plan_type || '').trim();
        const { plans, total } = await adminService.getAdminPlans({ limit, offset, search, planType });
        res.json({ success: true, data: { plans, total, limit, offset } });
    } catch (error) {
        logger.error('Admin getPlans error: %o', error);
        res.status(500).json({ error: 'ServerError', message: 'Failed to fetch plans' });
    }
};

/** PATCH /api/admin/plans/:id */
export const updatePlan = async (req, res) => {
    try {
        const { plan_type, expires_at, custom_maximums } = req.body;
        const plan = await adminService.updateUserPlan(req.params.id, plan_type, expires_at || null, custom_maximums || null);
        res.json({ success: true, data: plan });
    } catch (error) {
        const code = error.statusCode || 500;
        res.status(code).json({ error: 'Error', message: error.message || 'Failed to update plan' });
    }
};
