/**
 * useAuthActions - Advanced auth action hooks
 */
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook for login actions with enhanced UX
 */
export function useLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = useCallback(async (credentials) => {
        setIsLoading(true);
        setError(null);

        const result = await login(credentials, {
            onSuccess: (data) => {
                // Redirect to intended page or homepage
                const from = location.state?.from || '/';
                navigate(from, { replace: true });
            },
            onError: (error) => {
                setError(error.response?.data?.message || 'Login failed');
            }
        });

        setIsLoading(false);
        return result;
    }, [login, navigate, location]);

    const clearError = useCallback(() => setError(null), []);

    return {
        handleLogin,
        isLoading,
        error,
        clearError
    };
}

/**
 * Hook for logout actions with confirmation
 */
export function useLogout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = useCallback(async (options = {}) => {
        const {
            confirm = false,
            redirectTo = '/login',
            showConfirm = false
        } = options;

        if (showConfirm && !window.confirm('Bạn có chắc muốn đăng xuất?')) {
            return { cancelled: true };
        }

        setIsLoading(true);

        const result = await logout({
            onSuccess: () => {
                if (redirectTo) {
                    navigate(redirectTo, { replace: true });
                }
            }
        });

        setIsLoading(false);
        return result;
    }, [logout, navigate]);

    return {
        handleLogout,
        isLoading
    };
}

/**
 * Hook for user profile updates
 */
export function useUserProfile() {
    const { user, updateUser } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    const updateProfile = useCallback(async (userData) => {
        setIsUpdating(true);
        setUpdateError(null);

        try {
            // Call API to update user profile
            // const { data } = await userApi.updateProfile(userData);

            // Update local state
            updateUser(userData);

            return { success: true };
        } catch (error) {
            setUpdateError(error.response?.data?.message || 'Update failed');
            return { success: false, error };
        } finally {
            setIsUpdating(false);
        }
    }, [updateUser]);

    return {
        user,
        updateProfile,
        isUpdating,
        updateError
    };
}

/**
 * Hook for role-based access
 */
export function useRoleAccess() {
    const { user, isAdmin, isModerator } = useAuth();

    const hasRole = useCallback((roles) => {
        if (!user) return false;
        if (Array.isArray(roles)) {
            return roles.includes(user.role);
        }
        return user.role === roles;
    }, [user]);

    const hasPermission = useCallback((permission) => {
        if (!user) return false;

        // Define role permissions
        const rolePermissions = {
            'ADMIN': ['*'], // Admin has all permissions
            'MODERATOR': [
                'manage_reports',
                'moderate_content',
                'ban_users'
            ],
            'USER': [
                'create_listings',
                'message_users',
                'make_deals'
            ]
        };

        const userPermissions = rolePermissions[user.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
    }, [user]);

    const canAccess = useCallback((resource) => {
        if (!user) return false;

        // Define resource access rules
        const accessRules = {
            'admin_panel': ['ADMIN'],
            'moderation': ['ADMIN', 'MODERATOR'],
            'user_management': ['ADMIN'],
            'reports': ['ADMIN', 'MODERATOR'],
            'analytics': ['ADMIN']
        };

        const allowedRoles = accessRules[resource];
        return allowedRoles ? allowedRoles.includes(user.role) : true;
    }, [user]);

    return {
        user,
        isAdmin,
        isModerator,
        hasRole,
        hasPermission,
        canAccess
    };
}

/**
 * Hook for session management
 */
export function useSession() {
    const { token, isTokenExpired, authError, clearAuthError } = useAuth();
    const [sessionWarning, setSessionWarning] = useState(false);

    const checkSession = useCallback(() => {
        if (!token) return { valid: false, reason: 'no_token' };

        if (isTokenExpired(token)) {
            return { valid: false, reason: 'expired' };
        }

        return { valid: true };
    }, [token, isTokenExpired]);

    const getSessionTimeLeft = useCallback(() => {
        if (!token) return 0;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            return Math.max(0, exp - now);
        } catch {
            return 0;
        }
    }, [token]);

    return {
        checkSession,
        getSessionTimeLeft,
        sessionWarning,
        setSessionWarning,
        authError,
        clearAuthError
    };
}