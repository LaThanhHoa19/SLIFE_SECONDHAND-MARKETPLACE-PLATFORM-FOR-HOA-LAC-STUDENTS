/** Admin: GET /api/admin/dashboard — thống kê chỉ đọc cho tổng quan. */
import axiosClient from './axiosClient';

export const getAdminDashboard = () => axiosClient.get('/api/admin/dashboard');
