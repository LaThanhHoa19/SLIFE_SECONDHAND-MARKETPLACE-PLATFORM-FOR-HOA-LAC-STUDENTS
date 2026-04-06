/** Admin: GET /api/admin/dashboard + /charts — thống kê và biểu đồ. */
import adminAxiosClient from './adminAxiosClient';

export const getAdminDashboard = () => adminAxiosClient.get('/api/admin/dashboard');

/** Chuỗi thời gian 30 ngày gần nhất cho biểu đồ dashboard. */
export const getAdminDashboardCharts = () => adminAxiosClient.get('/api/admin/dashboard/charts');

/** Audit log gần nhất (10 dòng). */
export const getAdminAuditLog = (size = 10) =>
  adminAxiosClient.get('/api/admin/audit-logs', { params: { page: 0, size } });
