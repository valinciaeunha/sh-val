import * as usersService from "./users.service.js";
import logger from "../../utils/logger.js";

export const getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await usersService.getUserByUsername(username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error("Error fetching user profile:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        });
    }
};

export const getUserScripts = async (req, res) => {
    try {
        const { username } = req.params;
        const scripts = await usersService.getScriptsByUsername(username);

        res.json({
            success: true,
            data: scripts
        });
    } catch (error) {
        logger.error("Error fetching user scripts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user scripts"
        });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [stats, viewsHistory] = await Promise.all([
            usersService.getUserDashboardStats(userId),
            usersService.getUserViewsHistory(userId)
        ]);

        res.json({
            success: true,
            data: {
                totalScripts: parseInt(stats.total_scripts) || 0,
                totalViews: parseInt(stats.total_views) || 0,
                totalDownloads: parseInt(stats.total_downloads) || 0,
                totalLikes: parseInt(stats.total_likes) || 0,
                avgRating: 0, // Placeholder
                viewsHistory: viewsHistory?.map(h => ({
                    date: h.date,
                    views: parseInt(h.views)
                })) || []
            }
        });
    } catch (error) {
        logger.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats"
        });
    }
};

export const getApiKey = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await usersService.getApiKey(userId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error("Error fetching API key:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch API key"
        });
    }
};

export const generateApiKey = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await usersService.generateApiKey(userId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error("Error generating API key:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate API key"
        });
    }
};
