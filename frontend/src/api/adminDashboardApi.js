/** Admin: GET /api/admin/dashboard + /charts — thống kê và biểu đồ. */
import axiosClient from './axiosClient';

export const getAdminDashboard = () => axiosClient.get('/api/admin/dashboard');

/** Chuỗi thời gian 30 ngày gần nhất cho biểu đồ dashboard. */
export const getAdminDashboardCharts = () => axiosClient.get('/api/admin/dashboard/charts');

/** Audit log gần nhất (10 dòng). */
export const getAdminAuditLog = (size = 10) =>
  axiosClient.get('/api/admin/audit-logs', { params: { page: 0, size } });
