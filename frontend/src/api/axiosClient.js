/**
 * Mục đích: Axios instance với interceptor gắn JWT + chuẩn hoá lỗi + xử lý 401.
 * API dùng: tất cả /api/**.
 * Request mẫu: Authorization: Bearer <token>.
 * Response lỗi chuẩn (body): { code, message, data }. Object reject có thêm response (Axios) + raw.
 * 401: thử refresh token; hết hạn thật thì xóa JWT + redirect /login. 403: chỉ reject (không logout).
 * Props: N/A.
 * Validation: kiểm tra token tồn tại trước khi attach header.
 * Accessibility: lỗi sẽ được đẩy lên UI để hiển thị snackbar thân thiện.
 * Tests cần viết: attach token, bắt 401, mapping error response.
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const ACCESS_TOKEN_KEY = 'slife_access_token';
const REFRESH_TOKEN_KEY = 'slife_refresh_token';

function normalizeApiBaseUrl(baseUrl) {
    return (baseUrl || '').replace(/\/api\/?$/, '');
}

const axiosClient = axios.create({ baseURL: normalizeApiBaseUrl(API_BASE_URL), timeout: 15000 });
const refreshClient = axios.create({ baseURL: normalizeApiBaseUrl(API_BASE_URL), timeout: 15000 });

function dedupeApiPrefix(config) {
    const base = (config.baseURL || '').replace(/\/+$/, '');
    const url = config.url;

    const hasApiBase = /(^|\/)api$/.test(base);
    const hasApiInUrl = typeof url === 'string' && /^\/api(\/|$)/.test(url);

    if (hasApiBase && hasApiInUrl) {
        // Không strip: base .../api + url /api/public/... — cần giữ /api/public để khớp backend (tránh thành /public/...).
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

let refreshInFlight = null;

async function refreshAccessToken() {
    if (refreshInFlight) return refreshInFlight;

    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return null;

    refreshInFlight = (async () => {
        const response = await refreshClient.post('/api/auth/refresh', { refreshToken: storedRefreshToken });
        const payload = response?.data?.data ?? response?.data ?? null;
        const nextAccessToken = payload?.accessToken || payload?.token || null;
        if (!nextAccessToken) throw new Error('Missing access token in refresh response');

        localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
        if (payload?.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
        }
        return nextAccessToken;
    })().finally(() => {
        refreshInFlight = null;
    });

    return refreshInFlight;
}


axiosClient.interceptors.request.use((config) => {
    dedupeApiPrefix(config);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    setBearerToken(config, token);
    return config;
});
refreshClient.interceptors.request.use((config) => {
    dedupeApiPrefix(config);
    return config;
});
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalConfig = error?.config || {};
        const normalizedError = {
            status: error?.response?.status,
            message: error?.response?.data?.message || error.message || 'Unknown error',
            fieldErrors: error?.response?.data?.fieldErrors || {},
            raw: error,
            // Giữ nguyên response của Axios để catch (e) => e.response?.data?.message vẫn đọc được ApiResponse lỗi.
            response: error?.response,
        };
        // 403 = đã đăng nhập nhưng không đủ quyền (vd reply comment) — tuyệt đối không xóa token / redirect
        if (normalizedError.status === 401) {
            const isAuthEndpoint = originalConfig?.url?.includes('/api/auth/');
            const wasRetried = !!originalConfig._retry;
            if (!isAuthEndpoint && !wasRetried) {
                try {
                    originalConfig._retry = true;
                    const nextAccessToken = await refreshAccessToken();
                    if (nextAccessToken) {
                        setBearerToken(originalConfig, nextAccessToken);
                        return axiosClient(originalConfig);
                    }
                } catch (_) {
                    // fall through to cleanup + redirect
                }
            }

            const isAlreadyOnLogin = window.location.pathname === '/login';
            const hadToken = !!localStorage.getItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            // Chỉ redirect khi: không phải auth endpoint, không đang ở trang login, và trước đó có token
            if (!isAuthEndpoint && !isAlreadyOnLogin && hadToken) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(normalizedError);
    },
);
export default axiosClient;
