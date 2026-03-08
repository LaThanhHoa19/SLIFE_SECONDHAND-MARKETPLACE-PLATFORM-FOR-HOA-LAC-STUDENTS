/**
 * AuthContext - Advanced authentication management system
 *
 * Features:
 * - Auto token refresh
 * - Secure token storage với expiry check
 * - Error handling với retry logic
 * - User profile management
 * - Login/logout với callback support
 * - Session persistence
 * - Real-time auth state updates
 */
import { createContext, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import * as authApi from '../api/authApi';
import * as userApi from '../api/userApi';

// Constants
const TOKEN_KEY = 'slife_access_token';
const REFRESH_TOKEN_KEY = 'slife_refresh_token';
const USER_KEY = 'slife_user';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Core states
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem(REFRESH_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Refs for intervals
  const refreshIntervalRef = useRef(null);

  /**
   * Token utilities
   */
  const isTokenExpired = useCallback((tokenString) => {
    if (!tokenString) return true;
    try {
      const payload = JSON.parse(atob(tokenString.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  }, []);

  const getTokenExpiry = useCallback((tokenString) => {
    if (!tokenString) return null;
    try {
      const payload = JSON.parse(atob(tokenString.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }, []);

  /**
   * Auto refresh token
   */
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken || isTokenExpired(refreshToken)) {
      return false;
    }

    try {
      const { data } = await authApi.refreshToken({ refreshToken });

      // Update tokens
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      setToken(data.accessToken);

      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        setRefreshToken(data.refreshToken);
      }

      setAuthError(null);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);

      // Clear invalid tokens
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setAuthError('Session expired. Please login again.');

      return false;
    }
  }, [refreshToken, isTokenExpired]);

  /**
   * Setup auto refresh timer
   */
  const setupTokenRefresh = useCallback((tokenString) => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (!tokenString) return;

    const expiry = getTokenExpiry(tokenString);
    if (!expiry) return;

    const refreshTime = expiry - TOKEN_REFRESH_THRESHOLD;
    const now = Date.now();

    if (refreshTime > now) {
      const timeout = refreshTime - now;
      refreshIntervalRef.current = setTimeout(async () => {
        const success = await refreshAccessToken();
        if (success) {
          setupTokenRefresh(token); // Setup next refresh
        }
      }, timeout);
    }
  }, [getTokenExpiry, refreshAccessToken, token]);

  /**
   * Fetch user data from /api/users/me and update state.
   * Always call this after setting a new token to ensure correct user format.
   */
  const fetchAndSetUser = useCallback(async () => {
    try {
      const res = await userApi.getUser();
      const body = res?.data;
      const userPayload = body?.data ?? body;
      if (userPayload && typeof userPayload === 'object' && userPayload.id) {
        setUser(userPayload);
        localStorage.setItem(USER_KEY, JSON.stringify(userPayload));
        return userPayload;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Đăng nhập bằng Google SSO (id_token). Chỉ chấp nhận email @fpt.edu.vn.
   */
  const loginWithGoogle = useCallback(async (idToken, options = {}) => {
    try {
      setAuthLoading(true);
      setAuthError(null);

      const res = await authApi.googleOAuth({ idToken });
      const body = res.data;
      const payload = body?.data ?? body;

      const accessToken =
        payload?.accessToken ??
        payload?.token ??
        payload?.access_token ??
        body?.accessToken ??
        body?.token;
      if (!accessToken) {
        if (import.meta.env.DEV && body) {
          console.warn('[Auth] Response from server:', body);
          console.warn('[Auth] payload keys:', payload ? Object.keys(payload) : 'no payload');
        }
        setAuthError(
          payload?.message || body?.message || 'Invalid response from server. Chỉ email @fpt.edu.vn được phép.'
        );
        return { success: false, error: 'Invalid response from server' };
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      if (payload?.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
      }
      setToken(accessToken);
      setRefreshToken(payload?.refreshToken || null);

      // Fetch user data from /api/users/me to ensure correct format
      const userData = await fetchAndSetUser();
      if (!userData) {
        // Fallback to payload.user if fetch fails
        const fallbackUser = payload?.user ?? null;
        setUser(fallbackUser);
        if (fallbackUser) localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
      }

      setupTokenRefresh(accessToken);

      if (options.onSuccess) options.onSuccess(payload);
      return { success: true, data: payload };
    } catch (error) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Đăng nhập thất bại. Chỉ email @fpt.edu.vn được phép.';
      setAuthError(errorMessage);
      if (options.onError) options.onError(error);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  }, [setupTokenRefresh, fetchAndSetUser]);

  /**
   * Đăng nhập bằng tài khoản test (Alice / Bob) để test giao diện.
   */
  const loginWithTestAccount = useCallback(async (email, options = {}) => {
    try {
      setAuthLoading(true);
      setAuthError(null);

      const res = await authApi.testLogin(email);
      const body = res.data;
      const payload = body?.data ?? body;

      const accessToken =
        payload?.accessToken ?? payload?.token ?? payload?.access_token;
      if (!accessToken) {
        setAuthError(payload?.message || body?.message || 'Không lấy được token.');
        return { success: false, error: 'Invalid response' };
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      setToken(accessToken);
      setRefreshToken(payload?.refreshToken || null);

      // Fetch user data from /api/users/me to ensure correct format
      const userData = await fetchAndSetUser();
      if (!userData) {
        const fallbackUser = payload?.user ?? null;
        setUser(fallbackUser);
        if (fallbackUser) localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
      }

      setupTokenRefresh(accessToken);

      if (options.onSuccess) options.onSuccess(payload);
      return { success: true, data: payload };
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Đăng nhập thử nghiệm thất bại.';
      setAuthError(msg);
      if (options.onError) options.onError(error);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  }, [setupTokenRefresh, fetchAndSetUser]);

  /**
   * Enhanced logout
   */
  const logout = useCallback(async (options = {}) => {
    try {
      setAuthLoading(true);

      // Clear refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Call logout API (if token exists)
      if (token) {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignore logout API errors, continue with local cleanup
          console.warn('Logout API failed:', error);
        }
      }

      // Clear local storage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Clear state
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setAuthError(null);

      // Success callback
      if (options.onSuccess) {
        options.onSuccess();
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);

      // Force clear even if API fails
      localStorage.clear();
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setAuthError(null);

      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  }, [token]);

  /**
   * Update user profile
   */
  const updateUser = useCallback((userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, [user]);

  /**
   * Clear auth errors
   */
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  /**
   * Initialize auth state on app start.
   * Đọc token trực tiếp từ localStorage để tránh stale closure với React StrictMode.
   */
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      try {
        setAuthLoading(true);

        const storedToken = localStorage.getItem(TOKEN_KEY);

        if (!storedToken || isTokenExpired(storedToken)) {
          // Token không tồn tại hoặc hết hạn — clear state
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (!cancelled) {
            setToken(null);
            setRefreshToken(null);
            setUser(null);
          }
          return;
        }

        // Token hợp lệ — sync state với localStorage và fetch fresh user
        if (!cancelled) setToken(storedToken);

        try {
          const res = await userApi.getUser();
          const body = res?.data;
          const userPayload = body?.data ?? body;
          if (!cancelled && userPayload && typeof userPayload === 'object' && userPayload.id) {
            setUser(userPayload);
            localStorage.setItem(USER_KEY, JSON.stringify(userPayload));
            setupTokenRefresh(storedToken);
          }
        } catch {
          // Token không còn hợp lệ với backend — clear auth
          if (!cancelled) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Context value
  const value = useMemo(() => ({
    // Core state
    token,
    refreshToken,
    user,
    isAuthLoading,
    authError,

    // Auth methods
    loginWithGoogle,
    loginWithTestAccount,
    logout,
    updateUser,
    clearAuthError,

    // Utilities
    isAuthenticated: !!(token && user),
    isTokenExpired: (tokenString = token) => isTokenExpired(tokenString),

    // User role helpers
    isAdmin: user?.role === 'ADMIN',
    isModerator: ['ADMIN', 'MODERATOR'].includes(user?.role),
    isEmailVerified: user?.emailVerified || false
  }), [
    token,
    refreshToken,
    user,
    isAuthLoading,
    authError,
    loginWithGoogle,
    loginWithTestAccount,
    logout,
    updateUser,
    clearAuthError,
    isTokenExpired
  ]);

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}