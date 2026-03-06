/**
 * API xác thực – chỉ Google SSO (@fpt.edu.vn).
 * POST /api/auth/google body: { idToken }.
 * Response: { accessToken, refreshToken?, user }.
 */
import axiosClient from './axiosClient';

export const logout = () => axiosClient.post('/api/auth/logout');
export const refreshToken = (payload) => axiosClient.post('/api/auth/refresh', payload);
export const googleOAuth = (payload) => axiosClient.post('/api/auth/google', payload);
