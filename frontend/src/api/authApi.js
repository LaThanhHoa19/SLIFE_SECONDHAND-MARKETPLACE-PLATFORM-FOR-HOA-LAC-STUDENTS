/**
 * Mục đích: Gói API xác thực.
 * API dùng: POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh, POST /api/auth/google.
 * Request mẫu login: { email, password }.
 * Response mẫu: { accessToken, refreshToken, user: { userId, role, fullName } }.
 * Props: N/A.
 * Validation: email hợp lệ, mật khẩu tối thiểu 8 ký tự phía client trước khi gọi.
 * Accessibility: trả lỗi rõ ràng để gắn aria-describedby cho form error.
 * Tests cần viết: login thành công/thất bại, refresh token.
 */
import axiosClient from './axiosClient';
import authHttp from './authHttp';
import { getPersistedRefreshToken } from './authSessionStore';

/** Login/Google không gắn Bearer — tránh gửi nhầm phiên user/admin. */
export const login = (payload) => authHttp.post('/api/auth/login', payload);
export const logout = (payload) => axiosClient.post('/api/auth/logout', payload);
export const refreshToken = (payload = {}) => {
    const body = payload && typeof payload === 'object' ? { ...payload } : {};
    if (!body.refreshToken) {
        const rt = getPersistedRefreshToken();
        if (rt) body.refreshToken = rt;
    }
    return axiosClient.post('/api/auth/refresh', body);
};
export const googleOAuth = (payload) => authHttp.post('/api/auth/google', payload);
