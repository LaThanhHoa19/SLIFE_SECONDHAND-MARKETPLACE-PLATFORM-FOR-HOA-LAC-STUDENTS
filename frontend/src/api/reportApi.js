/** Mục đích/API: POST /api/reports, GET /api/admin/reports. */
import axiosClient from './axiosClient';
export const createReport = (payload) => axiosClient.post('/api/reports', payload);
export const getReports = (params) => axiosClient.get('/api/admin/reports', { params });
