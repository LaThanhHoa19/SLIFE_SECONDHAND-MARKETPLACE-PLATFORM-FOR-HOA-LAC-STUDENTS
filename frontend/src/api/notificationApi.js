/** Mục đích/API: GET /api/notifications, PATCH /api/notifications/{id}/read, PATCH /api/notifications/read-all. */
import axiosClient from './axiosClient';
export const getNotificationsPage = ({ limit = 30, cursor, scope = 'all' } = {}) =>
    axiosClient.get('/api/notifications', {
        params: {
            limit,
            scope,
            ...(cursor ? { cursor } : {}),
        },
    });

export const searchNotificationsPage = ({ q, limit = 30, cursor, scope = 'all' } = {}) =>
    axiosClient.get('/api/notifications/search', {
        params: {
            q: q ?? '',
            limit,
            scope,
            ...(cursor ? { cursor } : {}),
        },
    });

export const getUnreadNotificationCount = ({ scope = 'all' } = {}) =>
    axiosClient.get('/api/notifications/unread-count', { params: { scope } });
export const markNotificationRead = (id, { scope = 'all' } = {}) =>
    axiosClient.patch(`/api/notifications/${id}/read`, null, { params: { scope } });
export const markAllRead = ({ scope = 'all' } = {}) =>
    axiosClient.patch('/api/notifications/read-all', null, { params: { scope } });