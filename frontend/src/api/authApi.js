/**
 * API xác thực – Google SSO (@fpt.edu.vn) và đăng nhập test (Alice, Bob).
 */
import axiosClient from './axiosClient';

export const logout = () => axiosClient.post('/api/auth/logout');
export const refreshToken = (payload) => axiosClient.post('/api/auth/refresh', payload);