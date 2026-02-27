import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import hubsRoutes from '../modules/hubs/hubs.routes.js';
import scriptsRoutes from '../modules/scripts/scripts.routes.js';
import gamesRoutes from '../modules/games/games.routes.js';
import tagsRoutes from '../modules/tags/tags.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import executorsRoutes from '../modules/executors/executors.routes.js';
import keysRoutes from '../modules/keys/keys.routes.js';
import plansRoutes from '../modules/plans/plans.routes.js';
import deploymentsRoutes from '../modules/deployments/deployments.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import pool from '../db/postgres.js';
import logger from '../utils/logger.js';
import * as keysController from '../modules/keys/keys.controller.js';

const router = express.Router();

// ============================================
// API Routes
// ============================================

/**
 * Health check for API routes
 * GET /api/ping
 */
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Platform stats (public)
 * GET /api/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM scripts WHERE status = 'published' AND deleted_at IS NULL)::int AS total_scripts,
        (SELECT COUNT(DISTINCT owner_id) FROM scripts WHERE status = 'published' AND deleted_at IS NULL)::int AS total_developers,
        (SELECT COALESCE(SUM(views), 0) FROM scripts WHERE status = 'published' AND deleted_at IS NULL)::int AS total_views,
        (SELECT COUNT(*) FROM games)::int AS total_games,
        (SELECT COUNT(*) FROM hubs WHERE status = 'active')::int AS total_hubs
    `);
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        scripts: row.total_scripts,
        developers: row.total_developers,
        deployments: row.total_views,
        games: row.total_games,
        hubs: row.total_hubs,
      },
    });
  } catch (error) {
    logger.error('Stats Error: %o', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch stats' });
  }
});

/**
 * Authentication routes
 * /api/auth/*
 */
router.use('/auth', authRoutes);

// Hubs Routes
router.use('/hubs', hubsRoutes);

// Scripts Routes
router.use('/scripts', scriptsRoutes);

// Games Routes
router.use('/games', gamesRoutes);

// Tags Routes
router.use('/tags', tagsRoutes);

// Users Routes
router.use('/users', usersRoutes);

// Executors Routes
router.use('/executors', executorsRoutes);

// Keys Routes
router.use('/keys', keysRoutes);

// Plans Routes
router.use('/plans', plansRoutes);

// Deployments Routes
router.use('/deployments', deploymentsRoutes);

// Admin Routes
router.use('/admin', adminRoutes);



/**
 * 404 handler for API routes
 */
router.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'API endpoint not found',
    path: req.path,
  });
});

export default router;
