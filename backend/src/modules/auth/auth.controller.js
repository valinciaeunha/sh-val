import * as authService from "./auth.service.js";
import { deleteS3Object } from "../../utils/s3Delete.js";
import { body, validationResult } from "express-validator";

// ============================================
// Auth Controller - Request Handlers
// ============================================

/**
 * Validation Rules
 */
export const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter and one number",
    ),
  body("displayName")
    .trim()
    .notEmpty()
    .withMessage("Display name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Display name must be between 1 and 100 characters"),
];

export const loginValidation = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Username or email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter and one number",
    ),
];

/**
 * Validation Error Handler
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Invalid input data",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  return null;
};

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { username, email, password, displayName } = req.body;

    const result = await authService.registerUser({
      username,
      email,
      password,
      displayName,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "RegistrationError",
      message: error.message || "Failed to register user",
      ...(error.field && { field: error.field }),
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { identifier, password } = req.body;

    const result = await authService.loginUser(identifier, password);

    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "LoginError",
      message: error.message || "Failed to login",
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token is required",
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "RefreshTokenError",
      message: error.message || "Failed to refresh token",
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken && req.user) {
      await authService.logoutUser(req.user.userId, refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "LogoutError",
      message: error.message || "Failed to logout",
    });
  }
};

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
export const logoutAll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    await authService.logoutAllDevices(req.user.userId);

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "LogoutError",
      message: error.message || "Failed to logout from all devices",
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const user = await authService.getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "FetchUserError",
      message: error.message || "Failed to fetch user data",
    });
  }
};

/**
 * Update current user profile
 * PUT /api/auth/me
 */
export const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const { displayName, bio, avatarUrl } = req.body;

    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const user = await authService.updateUserProfile(req.user.userId, updates);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "UpdateProfileError",
      message: error.message || "Failed to update profile",
    });
  }
};

/**
 * Upload user avatar
 * POST /api/auth/me/avatar
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "BadRequest",
        message: "No file uploaded",
      });
    }

    // Get the S3 file key from multer-s3
    const avatarUrl = req.file.key || req.file.location;

    // Get current user to check for old avatar
    try {
      const currentUser = await authService.getUserById(req.user.userId);
      if (currentUser.avatarUrl) {
        await deleteS3Object(currentUser.avatarUrl);
      }
    } catch (err) {
      // Log error but continue with update (don't fail upload just because delete failed)
      console.warn("Failed to clean up old avatar:", err);
    }

    // Update user's avatar_url in database
    const user = await authService.updateUserProfile(req.user.userId, {
      avatar_url: avatarUrl,
    });

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { user, avatarUrl },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "UploadAvatarError",
      message: error.message || "Failed to upload avatar",
    });
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword,
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.name || "ChangePasswordError",
      message: error.message || "Failed to change password",
    });
  }
};

/**
 * Verify token (for testing)
 * GET /api/auth/verify
 */
export const verifyToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token",
    });
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  changePassword,
  verifyToken,
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
};
