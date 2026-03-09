/**
 * API xác thực – Google SSO (@fpt.edu.vn) và đăng nhập test (Alice, Bob).
 */
import axiosClient from './axiosClient';

export const logout = () => axiosClient.post('/api/auth/logout');
export const refreshToken = (payload) => axiosClient.post('/api/auth/refresh', payload);
export const googleOAuth = (payload) => axiosClient.post('/api/auth/google', payload);

/** Đăng nhập tài khoản test: alice@example.com, bob@example.com */
export const testLogin = (email) => axiosClient.get('/api/auth/test-login', { params: { email } });
