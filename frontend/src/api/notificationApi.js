/** Mục đích/API: GET /api/notifications, PATCH /api/notifications/{id}/read, PATCH /api/notifications/read-all. */
import axiosClient from './axiosClient';

const buildNotificationParams = ({ limit = 30, cursor, scope = 'all', readFilter = 'ALL', typeFilter = 'ALL', sortBy = 'NEWEST' } = {}) => ({
    limit,
    scope,
    readFilter,
    typeFilter,
    sortBy,
    ...(cursor ? { cursor } : {}),
});

export const getNotificationsPage = ({ limit = 7, cursor, scope = 'all', readFilter = 'ALL', typeFilter = 'ALL', sortBy = 'NEWEST' } = {}) =>
    axiosClient.get('/api/notifications', {
        params: buildNotificationParams({ limit, cursor, scope, readFilter, typeFilter, sortBy }),
    });

export const searchNotificationsPage = ({ q, limit = 30, cursor, scope = 'all', readFilter = 'ALL', typeFilter = 'ALL', sortBy = 'NEWEST' } = {}) =>
    axiosClient.get('/api/notifications/search', {
        params: {
            q: q ?? '',
            ...buildNotificationParams({ limit, cursor, scope, readFilter, typeFilter, sortBy }),
        },
    });

export const getUnreadNotificationCount = ({ scope = 'all' } = {}) =>
    axiosClient.get('/api/notifications/unread-count', { params: { scope } });
export const markNotificationRead = (id, { scope = 'all' } = {}) =>
    axiosClient.patch(`/api/notifications/${id}/read`, null, { params: { scope } });
export const markAllRead = ({ scope = 'all' } = {}) =>
    axiosClient.patch('/api/notifications/read-all', null, { params: { scope } });