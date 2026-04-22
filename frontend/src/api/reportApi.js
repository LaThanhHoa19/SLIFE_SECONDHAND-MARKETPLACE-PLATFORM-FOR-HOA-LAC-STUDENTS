/** Mục đích/API: POST /api/reports; admin: GET pending, GET page, GET by id, PATCH xử lý. */
import axiosClient from './axiosClient';
import uploadClient from './uploadClient';
import adminAxiosClient from './adminAxiosClient';

export const createReport = (payload) => axiosClient.post('/api/reports', payload);

export const uploadReportImage = (file) => {
    const form = new FormData();
    form.append('file', file);
    return uploadClient.post('/api/reports/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

/** Danh sách chờ xử lý (legacy / nhanh). */
export const getReports = (params) => adminAxiosClient.get('/api/admin/reports', { params });

/** Phân trang + lọc: targetType (LISTING | USER | OTHER), status, page, size, sortBy, sortDir. */
export const getReportsPage = (params) => adminAxiosClient.get('/api/admin/reports/page', { params });

export const getAdminReportById = (id) => adminAxiosClient.get(`/api/admin/reports/${id}`);

export const processReport = (id, payload) => adminAxiosClient.patch(`/api/admin/reports/${id}`, payload);
