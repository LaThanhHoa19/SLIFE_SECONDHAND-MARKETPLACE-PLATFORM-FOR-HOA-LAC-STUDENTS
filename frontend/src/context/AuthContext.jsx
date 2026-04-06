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
const SESSION_STARTED_AT_KEY = 'slife_session_started_at';
const LAST_ACTIVITY_AT_KEY = 'slife_last_activity_at';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const DEFAULT_MAX_SESSION_MS = 12 * 60 * 60 * 1000; // 12h
const DEFAULT_IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4h
const MAX_SESSION_MS = Number(import.meta.env.VITE_AUTH_MAX_SESSION_MS || DEFAULT_MAX_SESSION_MS);
const IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_AUTH_IDLE_TIMEOUT_MS || DEFAULT_IDLE_TIMEOUT_MS);

const unwrapApiData = (response) => {
  const body = response?.data;
  return body?.data ?? body ?? null;
};

const getAccessTokenFromPayload = (payload) =>
  payload?.accessToken || payload?.token || null;

const nowMs = () => Date.now();

const readTs = (key) => {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : null;
};

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
  const idleTimeoutRef = useRef(null);

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

  const clearAuthState = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_STARTED_AT_KEY);
    localStorage.removeItem(LAST_ACTIVITY_AT_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const touchSessionActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(nowMs()));
  }, []);

  const ensureSessionLifecycle = useCallback(() => {
    const startedAt = readTs(SESSION_STARTED_AT_KEY);
    const lastActivityAt = readTs(LAST_ACTIVITY_AT_KEY);
    const now = nowMs();

    if (startedAt && now - startedAt > MAX_SESSION_MS) {
      clearAuthState();
      setAuthError('Session reached maximum lifetime. Please login again.');
      return false;
    }

    if (lastActivityAt && now - lastActivityAt > IDLE_TIMEOUT_MS) {
      clearAuthState();
      setAuthError('Session expired due to inactivity. Please login again.');
      return false;
    }

    return true;
  }, [clearAuthState]);

  /**
   * Auto refresh token
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const payload = unwrapApiData(await authApi.refreshToken({}));
      const nextAccessToken = getAccessTokenFromPayload(payload);

      // Update tokens
      if (!nextAccessToken) {
        throw new Error('Missing access token');
      }
      localStorage.setItem(TOKEN_KEY, nextAccessToken);
      setToken(nextAccessToken);

      if (payload?.refreshToken) {
        setRefreshToken(payload.refreshToken);
      }
      touchSessionActivity();

      setAuthError(null);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);

      // Clear invalid tokens
      clearAuthState();
      setAuthError('Session expired. Please login again.');

      return false;
    }
  }, [touchSessionActivity, clearAuthState]);

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
   * Enhanced login với error handling
   */
  const login = useCallback(async (credentials, options = {}) => {
    try {
      setAuthLoading(true);
      setAuthError(null);

      const payload = unwrapApiData(await authApi.login(credentials));
      const accessToken = getAccessTokenFromPayload(payload);
      if (!accessToken || !payload?.user) {
        throw new Error('Invalid auth response');
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      localStorage.setItem(SESSION_STARTED_AT_KEY, String(nowMs()));
      touchSessionActivity();

      setToken(accessToken);
      setRefreshToken(payload.refreshToken ?? null);
      setUser(payload.user);

      // Setup auto refresh
      setupTokenRefresh(accessToken);

      // Success callback
      if (options.onSuccess) {
        options.onSuccess(payload);
      }

      return { success: true, data: payload };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setAuthError(errorMessage);

      // Error callback
      if (options.onError) {
        options.onError(error);
      }

      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  }, [setupTokenRefresh, touchSessionActivity]);

  const googleLogin = useCallback(async (credential, options = {}) => {
    try {
      setAuthLoading(true);
      setAuthError(null);

      const payload = unwrapApiData(await authApi.googleOAuth({ credential }));
      const accessToken = getAccessTokenFromPayload(payload);
      if (!accessToken || !payload?.user) {
        throw new Error('Invalid Google auth response');
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      localStorage.setItem(SESSION_STARTED_AT_KEY, String(nowMs()));
      touchSessionActivity();

      setToken(accessToken);
      setRefreshToken(payload.refreshToken ?? null);
      setUser(payload.user);
      setupTokenRefresh(accessToken);

      if (options.onSuccess) {
        options.onSuccess(payload);
      }

      return { success: true, data: payload };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Google login failed. Please try again.';
      setAuthError(errorMessage);
      if (options.onError) {
        options.onError(error);
      }
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  }, [setupTokenRefresh, touchSessionActivity]);

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
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
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
      // Clear state
      clearAuthState();
      setAuthError(null);

      // Success callback
      if (options.onSuccess) {
        options.onSuccess();
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);

      // Force clear even if API fails
      clearAuthState();
      setAuthError(null);

      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  }, [token, clearAuthState]);

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
   * Initialize auth state on app start
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthLoading(true);

        // Session policy check before token validation/refresh
        if (!ensureSessionLifecycle()) {
          setAuthLoading(false);
          return;
        }

        // Check if token exists and is valid
        if (!token || isTokenExpired(token)) {
          const refreshSuccess = await refreshAccessToken();
          if (!refreshSuccess) {
            clearAuthState();
            setAuthLoading(false);
            return;
          }
        }

        // Fetch latest user data if we have a valid token
        if (token && !isTokenExpired(token)) {
          try {
            const userData = unwrapApiData(await userApi.getUser());
            setUser(userData);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            touchSessionActivity();
            setupTokenRefresh(token);
          } catch (error) {
            console.error('Failed to fetch user (403/401):', error);
            // clear local storage immediately to stop spamming 403/401s
            clearAuthState();
            // Don't call full logout() as it might try to call the auth/logout API with the same bad token.
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Failed to initialize authentication');
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [token, refreshToken, isTokenExpired, refreshAccessToken, setupTokenRefresh, ensureSessionLifecycle, clearAuthState, touchSessionActivity]);

  /**
   * Session inactivity watchdog
   */
  useEffect(() => {
    if (!token || !user) return undefined;

    const scheduleIdleLogout = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        clearAuthState();
        setAuthError('Session expired due to inactivity. Please login again.');
      }, IDLE_TIMEOUT_MS);
    };

    const onActivity = () => {
      touchSessionActivity();
      scheduleIdleLogout();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    scheduleIdleLogout();
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [token, user, clearAuthState, touchSessionActivity]);

  // Context value
  const value = useMemo(() => ({
    // Core state
    token,
    refreshToken,
    user,
    isAuthLoading,
    authError,

    // Auth methods
    login,
    googleLogin,
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
    login,
    googleLogin,
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