/** Mục đích/API: GET /api/notifications, PATCH /api/notifications/{id}/read, PATCH /api/notifications/read-all. */
import axiosClient from './axiosClient';
export const getNotifications = () => axiosClient.get('/notifications');
export const markNotificationRead = (id) => axiosClient.patch(`/notifications/${id}/read`);
export const markAllRead = () => axiosClient.patch('/notifications/read-all');