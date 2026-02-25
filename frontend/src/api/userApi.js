/** Mục đích/API: GET /api/users/me, PUT /api/users/me, POST /api/users/{id}/block. */
import axiosClient from './axiosClient';
export const getUser = () => axiosClient.get('/api/users/me');
export const updateUser = (payload) => axiosClient.put('/api/users/me', payload);
export const blockUser = (userId, reason) => axiosClient.post(`/api/users/${userId}/block`, { reason });
