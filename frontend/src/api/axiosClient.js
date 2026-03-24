/**
 * Mục đích: Axios instance với interceptor gắn JWT + chuẩn hoá lỗi + xử lý 401.
 * API dùng: tất cả /api/**.
 * Request mẫu: Authorization: Bearer <token>.
 * Response lỗi chuẩn: { message, code, fieldErrors? }.
 * Props: N/A.
 * Validation: kiểm tra token tồn tại trước khi attach header.
 * Accessibility: lỗi sẽ được đẩy lên UI để hiển thị snackbar thân thiện.
 * Tests cần viết: attach token, bắt 401, mapping error response.
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

function normalizeApiBaseUrl(baseUrl) {
    return (baseUrl || '').replace(/\/api\/?$/, '');
}

const axiosClient = axios.create({ baseURL: normalizeApiBaseUrl(API_BASE_URL), timeout: 15000 });

function dedupeApiPrefix(config) {
    const base = (config.baseURL || '').replace(/\/+$/, '');
    const url = config.url;

    const hasApiBase = /(^|\/)api$/.test(base);
    const hasApiInUrl = typeof url === 'string' && /^\/api(\/|$)/.test(url);

    if (hasApiBase && hasApiInUrl) {
        config.url = url.replace(/^\/api(?=\/|$)/, '') || '/';
    }

    return config;
}


axiosClient.interceptors.request.use((config) => {
    dedupeApiPrefix(config);


    const token = localStorage.getItem('slife_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const normalizedError = {
            status: error?.response?.status,
            message: error?.response?.data?.message || error.message || 'Unknown error',
            fieldErrors: error?.response?.data?.fieldErrors || {},
            raw: error,
        };
        if (normalizedError.status === 401) {
            const isAuthEndpoint = error?.config?.url?.includes('/api/auth/');
            const isAlreadyOnLogin = window.location.pathname === '/login';
            const hadToken = !!localStorage.getItem('slife_access_token');
            localStorage.removeItem('slife_access_token');
            // Chỉ redirect khi: không phải auth endpoint, không đang ở trang login, và trước đó có token
            if (!isAuthEndpoint && !isAlreadyOnLogin && hadToken) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(normalizedError);
    },
);
export default axiosClient;
