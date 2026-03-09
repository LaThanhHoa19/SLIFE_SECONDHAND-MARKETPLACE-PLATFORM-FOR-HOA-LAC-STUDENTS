/**
 * useAuthActions - Auth action hooks (Google SSO only).
 */
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook for Google SSO login.
 */
export function useLogin() {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = useCallback(async (idToken) => {
        setIsLoading(true);
        setError(null);
        const result = await loginWithGoogle(idToken, {
            onSuccess: () => {
                const from = location.state?.from || '/';
                navigate(from, { replace: true });
            },
            onError: (err) => {
                setError(err?.response?.data?.message || 'Đăng nhập thất bại.');
            },
        });
        setIsLoading(false);
        return result;
    }, [loginWithGoogle, navigate, location]);

    const clearError = useCallback(() => setError(null), []);

    return { handleLogin, isLoading, error, clearError };
}

export function useLogout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = useCallback(async (options = {}) => {
        const { redirectTo = '/login', showConfirm = false } = options;
        if (showConfirm && !window.confirm('Bạn có chắc muốn đăng xuất?')) {
            return { cancelled: true };
        }
        setIsLoading(true);
        const result = await logout({
            onSuccess: () => {
                if (redirectTo) navigate(redirectTo, { replace: true });
            },
        });
        setIsLoading(false);
        return result;
    }, [logout, navigate]);

    return { handleLogout, isLoading };
}

export function useUserProfile() {
    const { user, updateUser } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    const updateProfile = useCallback(async (userData) => {
        setIsUpdating(true);
        setUpdateError(null);
        try {
            updateUser(userData);
            return { success: true };
        } catch (err) {
            setUpdateError(err?.response?.data?.message || 'Update failed');
            return { success: false, error: err };
        } finally {
            setIsUpdating(false);
        }
    }, [updateUser]);

    return { user, updateProfile, isUpdating, updateError };
}

export function useRoleAccess() {
    const { user, isAdmin, isModerator } = useAuth();

    const hasRole = useCallback((roles) => {
        if (!user) return false;
        return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
    }, [user]);

    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        const rolePermissions = {
            ADMIN: ['*'],
            MODERATOR: ['manage_reports', 'moderate_content', 'ban_users'],
            USER: ['create_listings', 'message_users', 'make_deals'],
        };
        const perms = rolePermissions[user.role] || [];
        return perms.includes('*') || perms.includes(permission);
    }, [user]);

    const canAccess = useCallback((resource) => {
        if (!user) return false;
        const accessRules = {
            admin_panel: ['ADMIN'],
            moderation: ['ADMIN', 'MODERATOR'],
            user_management: ['ADMIN'],
            reports: ['ADMIN', 'MODERATOR'],
            analytics: ['ADMIN'],
        };
        const allowed = accessRules[resource];
        return allowed ? allowed.includes(user.role) : true;
    }, [user]);

    return { user, isAdmin, isModerator, hasRole, hasPermission, canAccess };
}

export function useSession() {
    const { token, isTokenExpired, authError, clearAuthError } = useAuth();
    const [sessionWarning, setSessionWarning] = useState(false);

    const checkSession = useCallback(() => {
        if (!token) return { valid: false, reason: 'no_token' };
        if (isTokenExpired(token)) return { valid: false, reason: 'expired' };
        return { valid: true };
    }, [token, isTokenExpired]);

    const getSessionTimeLeft = useCallback(() => {
        if (!token) return 0;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Math.max(0, (payload.exp * 1000) - Date.now());
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
        clearAuthError,
    };
}
