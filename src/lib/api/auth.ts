import apiClient, { handleApiError, tokenManager } from './client';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

// ============================================
// Auth API Types
// ============================================

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  emailVerified: boolean;
  accountStatus: string;
  roles: string[];
  permissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: string;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// Auth API Functions
// ============================================

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<{ user: User }> => {
  try {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/login', data);
    const { user, accessToken, expiresIn } = response.data.data;

    // Store tokens
    tokenManager.setAccessToken(accessToken);

    // Store user data securely in localStorage instead of a vulnerability-prone cookie
    if (typeof window !== 'undefined') {
      const storageKey = process.env.NEXT_PUBLIC_USER_KEY || 'scripthub_user';
      localStorage.setItem(storageKey, JSON.stringify(user));
    }

    return { user, accessToken, expiresIn };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = tokenManager.getRefreshToken();
    await apiClient.post('/auth/logout', { refreshToken });
  } catch (error) {
    // Ignore logout errors
    // error silently handled
  } finally {
    // Clear tokens regardless of API call result
    tokenManager.clearTokens();
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout-all');
  } catch (error) {
    throw handleApiError(error);
  } finally {
    tokenManager.clearTokens();
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<{ accessToken: string }> => {
  try {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data.data;

    // Update stored token
    tokenManager.setAccessToken(accessToken);

    return { accessToken };
  } catch (error) {
    tokenManager.clearTokens();
    throw handleApiError(error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<{ user: User }> => {
  try {
    const response = await apiClient.get('/auth/me');
    const { user } = response.data.data;

    // Update stored user data in localStorage
    if (typeof window !== 'undefined') {
      const storageKey = process.env.NEXT_PUBLIC_USER_KEY || 'scripthub_user';
      localStorage.setItem(storageKey, JSON.stringify(user));
    }

    return { user };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<{ user: User }> => {
  try {
    const response = await apiClient.put('/auth/me', data);
    const { user } = response.data.data;

    // Update stored user data in localStorage
    if (typeof window !== 'undefined') {
      const storageKey = process.env.NEXT_PUBLIC_USER_KEY || 'scripthub_user';
      localStorage.setItem(storageKey, JSON.stringify(user));
    }

    return { user };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file: File): Promise<{ user: User; avatarUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { user, avatarUrl } = response.data.data;

    // Update stored user data in localStorage
    if (typeof window !== 'undefined') {
      const storageKey = process.env.NEXT_PUBLIC_USER_KEY || 'scripthub_user';
      localStorage.setItem(storageKey, JSON.stringify(user));
    }

    return { user, avatarUrl };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  try {
    await apiClient.post('/auth/change-password', data);
    // Password changed successfully, tokens are revoked
    tokenManager.clearTokens();
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify token
 */
export const verifyToken = async (): Promise<{ user: User }> => {
  try {
    const response = await apiClient.get('/auth/verify');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get stored user data from localStorage
 */
export const getStoredUser = (): User | null => {
  try {
    if (typeof window === 'undefined') return null;

    const storageKey = process.env.NEXT_PUBLIC_USER_KEY || 'scripthub_user';
    const userStr = localStorage.getItem(storageKey);

    if (!userStr) return null;

    return JSON.parse(String(userStr)) as User;
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = tokenManager.getAccessToken();
  return !!token;
};

/**
 * Discord OAuth login
 */
export const loginWithDiscord = (): void => {
  if (typeof window === 'undefined') return;

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
  window.location.href = `${apiUrl}/auth/discord`;
};

/**
 * Handle OAuth callback (for Discord, Google, etc)
 */
export const handleOAuthCallback = (
  accessToken: string,
  refreshToken: string
): void => {
  tokenManager.setTokens(accessToken, refreshToken);
};

// ============================================
// Export all auth functions
// ============================================

export const authApi = {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  changePassword,
  verifyToken,
  getStoredUser,
  isAuthenticated,
  loginWithDiscord,
  handleOAuthCallback,
};

export default authApi;
