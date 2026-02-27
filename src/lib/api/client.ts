import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// ============================================
// API Client Configuration
// ============================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL as string;
const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT as string,
  10,
);

// Token storage keys
const ACCESS_TOKEN_KEY =
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY as string;
const REFRESH_TOKEN_KEY =
  process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY as string;

// ============================================
// Token Management
// ============================================

import { getCookie, setCookie, deleteCookie } from "cookies-next";

export const tokenManager = {
  getAccessToken: (): string | null => {
    const token = getCookie(ACCESS_TOKEN_KEY);
    return token ? String(token) : null;
  },

  setAccessToken: (token: string): void => {
    setCookie(ACCESS_TOKEN_KEY, token, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // 7 days
  },

  getRefreshToken: (): string | null => {
    const token = getCookie(REFRESH_TOKEN_KEY);
    return token ? String(token) : null;
  },

  setRefreshToken: (token: string): void => {
    setCookie(REFRESH_TOKEN_KEY, token, { maxAge: 60 * 60 * 24 * 30, path: '/' }); // 30 days
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    tokenManager.setAccessToken(accessToken);
    tokenManager.setRefreshToken(refreshToken);
  },

  clearTokens: (): void => {
    deleteCookie(ACCESS_TOKEN_KEY, { path: '/' });
    deleteCookie(REFRESH_TOKEN_KEY, { path: '/' });

    if (typeof window !== 'undefined') {
      const storageKey = process.env.NEXT_PUBLIC_USER_KEY || 'scripthub_user';
      localStorage.removeItem(storageKey);
    }
  },
};

// ============================================
// Create Axios Instance
// ============================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For cookies
});

// ============================================
// Request Interceptor
// ============================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add access token to requests
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============================================
// Response Interceptor (Token Refresh)
// ============================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't tried to refresh yet
    // Skip refresh logic for auth endpoints (login/register should show errors in the modal)
    const requestUrl = originalRequest.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        // No refresh token, logout
        tokenManager.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/home";
        }
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );

        const { accessToken } = response.data.data;

        // Save new token
        tokenManager.setAccessToken(accessToken);

        // Update default headers
        if (apiClient.defaults.headers.common) {
          apiClient.defaults.headers.common["Authorization"] =
            `Bearer ${accessToken}`;
        }

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        processQueue(refreshError as Error, null);
        tokenManager.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/home";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ============================================
// API Error Handler
// ============================================

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
  details?: Array<{
    field?: string;
    message?: string;
    path?: string; // express-validator v7
    msg?: string;  // express-validator v7
  }>;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    if (axiosError.response) {
      // Server responded with error
      const errorData = axiosError.response.data;

      // Log detailed error for debugging

      // Format validation errors if present
      let message = errorData?.message || "An error occurred";
      if (errorData?.details && errorData.details.length > 0) {
        const fieldErrors = errorData.details
          .map((d) => `${d.path || d.field}: ${d.msg || d.message}`)
          .join(", ");
        message = `${message} (${fieldErrors})`;
      }

      return {
        message,
        error: errorData?.error || "Error",
        statusCode: axiosError.response.status,
        details: errorData?.details,
      };
    } else if (axiosError.request) {
      // Request made but no response — silently fail
      return {
        message: "No response from server. Please check your connection.",
        error: "NetworkError",
        statusCode: 0,
      };
    }
  }

  // Other errors
  // Error silently handled
  return {
    message:
      error instanceof Error ? error.message : "An unexpected error occurred",
    error: "UnknownError",
  };
};

// ============================================
// Export API Client
// ============================================

export default apiClient;
