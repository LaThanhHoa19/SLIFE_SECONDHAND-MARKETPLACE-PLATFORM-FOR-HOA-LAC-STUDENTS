/** Mục đích/API: POST /api/reports, GET /api/admin/reports. */
import axiosClient from './axiosClient';

export const createReport = (payload) => axiosClient.post('/api/reports', payload);

export const getReports = (params) => axiosClient.get('/api/admin/reports', { params });

export const resolveReport = (id, payload) => axiosClient.put(`/api/admin/reports/${id}/resolve`, payload);

