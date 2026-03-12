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
export const login = (payload) => axiosClient.post('/api/auth/login', payload);
export const logout = () => axiosClient.post('/api/auth/logout');
export const refreshToken = (payload) => axiosClient.post('/api/auth/refresh', payload);
export const googleOAuth = (payload) => axiosClient.post('/api/auth/google', payload);
