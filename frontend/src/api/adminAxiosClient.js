/**
 * Axios cho khu vực admin — Bearer lấy từ memory (admin), refresh cập nhật admin token.
 * 401 → redirect /admin/login (không đụng /login người dùng).
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getPersistedRefreshToken, setPersistedRefreshToken } from './authSessionStore';

let inMemoryAdminAccessToken = null;

export function setAdminAccessToken(token) {
    inMemoryAdminAccessToken = token || null;
}

export function getAdminAccessToken() {
    return inMemoryAdminAccessToken;
}

export function clearAdminAccessToken() {
    inMemoryAdminAccessToken = null;
}

function normalizeApiBaseUrl(baseUrl) {
    return (baseUrl || '').replace(/\/api\/?$/, '');
}

const adminAxiosClient = axios.create({
    baseURL: normalizeApiBaseUrl(API_BASE_URL),
    timeout: 15000,
    withCredentials: true,
});
const adminRefreshClient = axios.create({
    baseURL: normalizeApiBaseUrl(API_BASE_URL),
    timeout: 15000,
    withCredentials: true,
});

function dedupeApiPrefix(config) {
    const base = (config.baseURL || '').replace(/\/+$/, '');
    const url = config.url;

    const hasApiBase = /(^|\/)api$/.test(base);
    const hasApiInUrl = typeof url === 'string' && /^\/api(\/|$)/.test(url);

    if (hasApiBase && hasApiInUrl) {
        if (typeof url === 'string' && /^\/api\/public(\/|$)/.test(url)) {
            return config;
        }
        config.url = url.replace(/^\/api(?=\/|$)/, '') || '/';
    }

    return config;
}

function setBearerToken(config, token) {
    config.headers = config.headers || {};
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
        delete config.headers.Authorization;
    }
}

let adminRefreshInFlight = null;

async function refreshAdminAccessToken() {
    if (adminRefreshInFlight) return adminRefreshInFlight;

    adminRefreshInFlight = (async () => {
        const rt = getPersistedRefreshToken();
        const response = await adminRefreshClient.post(
            '/api/auth/refresh',
            rt ? { refreshToken: rt } : {},
        );
        const payload = response?.data?.data ?? response?.data ?? null;
        const nextAccessToken = payload?.accessToken || payload?.token || null;
        if (!nextAccessToken) throw new Error('Missing access token in refresh response');

        setAdminAccessToken(nextAccessToken);
        if (payload?.refreshToken) setPersistedRefreshToken(payload.refreshToken);
        return nextAccessToken;
    })().finally(() => {
        adminRefreshInFlight = null;
    });

    return adminRefreshInFlight;
}

/** Gọi từ AdminAuthContext (timer refresh), không dùng axios user. */
export async function refreshAdminSessionToken() {
    return refreshAdminAccessToken();
}

adminAxiosClient.interceptors.request.use((config) => {
    dedupeApiPrefix(config);
    const token = getAdminAccessToken();
    setBearerToken(config, token);
    return config;
});

adminRefreshClient.interceptors.request.use((config) => {
    dedupeApiPrefix(config);
    return config;
});

adminAxiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalConfig = error?.config || {};
        const normalizedError = {
            status: error?.response?.status,
            message: error?.response?.data?.message || error.message || 'Unknown error',
            fieldErrors: error?.response?.data?.fieldErrors || {},
            raw: error,
            response: error?.response,
        };

        if (normalizedError.status === 401) {
            const isAuthEndpoint = originalConfig?.url?.includes('/api/auth/');
            const wasRetried = !!originalConfig._retry;
            if (!isAuthEndpoint && !wasRetried) {
                try {
                    originalConfig._retry = true;
                    const nextAccessToken = await refreshAdminAccessToken();
                    if (nextAccessToken) {
                        setBearerToken(originalConfig, nextAccessToken);
                        return adminAxiosClient(originalConfig);
                    }
                } catch (_) {
                    /* fall through */
                }
            }

            const isAlreadyOnAdminLogin = window.location.pathname === '/admin/login';
            const hadToken = !!getAdminAccessToken();
            clearAdminAccessToken();
            if (!isAuthEndpoint && !isAlreadyOnAdminLogin && hadToken) {
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(normalizedError);
    },
);

export default adminAxiosClient;
