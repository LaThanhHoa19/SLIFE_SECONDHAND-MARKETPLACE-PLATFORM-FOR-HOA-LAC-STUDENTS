/** Mục đích/API: GET /api/notifications, PATCH /api/notifications/{id}/read, PATCH /api/notifications/read-all. */
import axiosClient from './axiosClient';
export const getNotifications = () => axiosClient.get('/api/notifications');
export const markNotificationRead = (id) => axiosClient.patch(`/api/notifications/${id}/read`);
export const markAllRead = () => axiosClient.patch('/api/notifications/read-all');
