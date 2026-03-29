/** Mục đích/API: POST /api/reports; admin: GET pending, GET page, GET by id, PATCH xử lý. */
import axiosClient from './axiosClient';

export const createReport = (payload) => axiosClient.post('/api/reports', payload);

/** Danh sách chờ xử lý (legacy / nhanh). */
export const getReports = (params) => axiosClient.get('/api/admin/reports', { params });

/** Phân trang + lọc: targetType (LISTING | USER | OTHER), status, page, size, sortBy, sortDir. */
export const getReportsPage = (params) => axiosClient.get('/api/admin/reports/page', { params });

export const getAdminReportById = (id) => axiosClient.get(`/api/admin/reports/${id}`);

export const processReport = (id, payload) => axiosClient.patch(`/api/admin/reports/${id}`, payload);

export const resolveReport = (id, payload) => axiosClient.put(`/api/admin/reports/${id}/resolve`, payload);

