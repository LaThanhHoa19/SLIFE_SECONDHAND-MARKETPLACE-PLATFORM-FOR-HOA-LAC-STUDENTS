import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as authApi from '../api/authApi';
import adminAxiosClient, {
    clearAdminAccessToken,
    getAdminAccessToken,
    refreshAdminSessionToken,
    setAdminAccessToken,
} from '../api/adminAxiosClient';
import { clearAdminUserSnapshot, getAdminUserSnapshot, setAdminUserSnapshot } from '../adminSessionStore';

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

const unwrapApiData = (response) => {
    const body = response?.data;
    return body?.data ?? body ?? null;
};

const getAccessTokenFromPayload = (payload) => payload?.accessToken || payload?.token || null;

const isStaffRole = (role) => role === 'ADMIN' || role === 'MODERATOR';

function parseJwtExp(tokenString) {
    try {
        const payload = JSON.parse(atob(tokenString.split('.')[1]));
        return payload.exp * 1000;
    } catch {
        return null;
    }
}

export const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
    const [adminToken, setAdminToken] = useState(() => getAdminAccessToken());
    const [adminUser, setAdminUser] = useState(() => getAdminUserSnapshot());
    const [isAdminAuthLoading, setAdminAuthLoading] = useState(true);
    const refreshIntervalRef = useRef(null);

    const clearAdminLocal = useCallback(() => {
        clearAdminAccessToken();
        setAdminToken(null);
        setAdminUser(null);
        setAdminUserSnapshot(null);
        if (refreshIntervalRef.current) {
            clearTimeout(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    const setupAdminTokenRefresh = useCallback((tokenString) => {
        if (refreshIntervalRef.current) {
            clearTimeout(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
        if (!tokenString) return;
        const expiry = parseJwtExp(tokenString);
        if (!expiry) return;
        const refreshTime = expiry - TOKEN_REFRESH_THRESHOLD;
        const now = Date.now();
        if (refreshTime > now) {
            refreshIntervalRef.current = setTimeout(async () => {
                try {
                    const next = await refreshAdminSessionToken();
                    if (next) {
                        setAdminToken(next);
                        setupAdminTokenRefresh(next);
                    }
                } catch {
                    clearAdminLocal();
                }
            }, refreshTime - now);
        }
    }, [clearAdminLocal]);

    const applyAdminSession = useCallback(
        (accessToken, user) => {
            setAdminAccessToken(accessToken);
            setAdminToken(accessToken);
            setAdminUser(user);
            setAdminUserSnapshot(user);
            setupAdminTokenRefresh(accessToken);
        },
        [setupAdminTokenRefresh],
    );

    /** Đăng nhập admin — không cập nhật AuthContext (phiên user). */
    const adminLogin = useCallback(
        async (credentials, options = {}) => {
            try {
                setAdminAuthLoading(true);
                window.dispatchEvent(new CustomEvent('slife-clear-user-session'));
                const payload = unwrapApiData(await authApi.login(credentials));
                const accessToken = getAccessTokenFromPayload(payload);
                if (!accessToken || !payload?.user) {
                    throw new Error('Invalid auth response');
                }
                if (!isStaffRole(payload.user.role)) {
                    clearAdminLocal();
                    const err = 'Tài khoản không có quyền truy cập trang quản trị.';
                    if (options.onError) options.onError(new Error(err));
                    return { success: false, error: err };
                }
                applyAdminSession(accessToken, payload.user);
                if (options.onSuccess) options.onSuccess(payload);
                return { success: true, data: payload };
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại.';
                if (options.onError) options.onError(error);
                return { success: false, error: errorMessage };
            } finally {
                setAdminAuthLoading(false);
            }
        },
        [applyAdminSession, clearAdminLocal],
    );

    const adminLogout = useCallback(async (options = {}) => {
        try {
            setAdminAuthLoading(true);
            if (getAdminAccessToken()) {
                try {
                    await adminAxiosClient.post('/api/auth/logout');
                } catch {
                    /* ignore */
                }
            }
            clearAdminLocal();
            if (options.onSuccess) options.onSuccess();
            return { success: true };
        } catch (e) {
            clearAdminLocal();
            return { success: false, error: e.message };
        } finally {
            setAdminAuthLoading(false);
        }
    }, [clearAdminLocal]);

    useEffect(() => {
        const onBootstrap = (e) => {
            const user = e.detail;
            if (!user) return;
            const t = getAdminAccessToken();
            setAdminToken(t);
            setAdminUser(user);
            setAdminUserSnapshot(user);
            if (t) setupAdminTokenRefresh(t);
        };
        const onClearAdmin = () => {
            clearAdminLocal();
        };
        if (!adminUser) {
            const snapshot = getAdminUserSnapshot();
            if (snapshot) {
                setAdminUser(snapshot);
            }
        }
        window.addEventListener('slife-admin-bootstrap', onBootstrap);
        window.addEventListener('slife-clear-admin-session', onClearAdmin);
        return () => {
            window.removeEventListener('slife-admin-bootstrap', onBootstrap);
            window.removeEventListener('slife-clear-admin-session', onClearAdmin);
        };
    }, [clearAdminLocal, setupAdminTokenRefresh]);

    useEffect(() => {
        const onUserAuthReady = () => setAdminAuthLoading(false);
        window.addEventListener('slife-auth-bootstrap-complete', onUserAuthReady);
        return () => window.removeEventListener('slife-auth-bootstrap-complete', onUserAuthReady);
    }, []);

    useEffect(() => {
        const t = getAdminAccessToken();
        if (t && adminUser) {
            setAdminUserSnapshot(adminUser);
        }
    }, [adminUser]);

    const value = useMemo(
        () => ({
            adminToken,
            adminUser,
            isAdminAuthLoading,
            adminLogin,
            adminLogout,
            isAdminAuthenticated: !!(adminToken && adminUser && isStaffRole(adminUser.role)),
        }),
        [adminToken, adminUser, isAdminAuthLoading, adminLogin, adminLogout],
    );

    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
