/** Mục đích/API: GET /api/notifications, PATCH /api/notifications/{id}/read, PATCH /api/notifications/read-all. */
import axiosClient from './axiosClient';
export const getNotificationsPage = ({ limit = 30, cursor } = {}) =>
  axiosClient.get('/api/notifications', {
    params: {
      limit,
      ...(cursor ? { cursor } : {}),
    },
  });

export const searchNotificationsPage = ({ q, limit = 30, cursor } = {}) =>
  axiosClient.get('/api/notifications/search', {
    params: {
      q: q ?? '',
      limit,
      ...(cursor ? { cursor } : {}),
    },
  });

export const getUnreadNotificationCount = () =>
  axiosClient.get('/api/notifications/unread-count');
export const markNotificationRead = (id) => axiosClient.patch(`/api/notifications/${id}/read`);
export const markAllRead = () => axiosClient.patch('/api/notifications/read-all');