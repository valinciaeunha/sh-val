import express from "express";
import passport from "passport";
import * as authController from "./auth.controller.js";
import { authenticate, optionalAuth } from "../../middleware/auth.js";
import { imageUpload } from "../../middleware/upload.js";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// ============================================
// Public Routes (No Authentication Required)
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  "/register",
  authController.registerValidation,
  authController.register,
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", authController.loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post("/refresh", authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Public (but works better with auth)
 */
router.post("/logout", optionalAuth, authController.logout);

// ============================================
// Protected Routes (Authentication Required)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put("/me", authenticate, authController.updateProfile);

/**
 * @route   POST /api/auth/me/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  "/me/avatar",
  authenticate,
  (req, res, next) => { req.uploadFolder = 'avatars'; next(); },
  imageUpload.single('avatar'),
  authController.uploadAvatar
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  "/change-password",
  authenticate,
  authController.changePasswordValidation,
  authController.changePassword,
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.get("/verify", authenticate, authController.verifyToken);

// ============================================
// Discord OAuth Routes
// ============================================

/**
 * @route   GET /api/auth/discord
 * @desc    Initiate Discord OAuth flow
 * @access  Public
 */
router.get(
  "/discord",
  (req, res, next) => {
    if (!config.discord.clientId || !config.discord.clientSecret) {
      return res.status(503).json({
        error: "ServiceUnavailable",
        message: "Discord OAuth is not configured",
      });
    }
    next();
  },
  passport.authenticate("discord", { session: false }),
);

/**
 * @route   GET /api/auth/discord/callback
 * @desc    Discord OAuth callback
 * @access  Public
 */
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    session: false,
    failureRedirect: `${config.frontendUrl}/home?error=auth_failed`,
  }),
  (req, res) => {
    try {
      // User is authenticated via Discord
      const user = req.user;

      if (!user || !user.tokens) {
        return res.redirect(`${config.frontendUrl}/home?error=auth_failed`);
      }

      // Redirect to frontend with tokens
      const redirectUrl = `${config.frontendUrl}/auth/callback?token=${user.tokens.accessToken}&refresh=${user.tokens.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error("Discord callback error:", error);
      res.redirect(`${config.frontendUrl}/home?error=server_error`);
    }
  },
);

export default router;
