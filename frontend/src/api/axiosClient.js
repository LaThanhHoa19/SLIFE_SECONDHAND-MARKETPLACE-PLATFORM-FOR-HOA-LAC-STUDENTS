/**
 * Mục đích: Axios instance với interceptor gắn JWT + chuẩn hoá lỗi + xử lý 401.
 * API dùng: tất cả /api/**.
 * Request mẫu: Authorization: Bearer <token>.
 * Response lỗi chuẩn: { message, code, fieldErrors? }.
 * Props: N/A.
 * Validation: kiểm tra token tồn tại trước khi attach header.
 * Accessibility: lỗi sẽ được đẩy lên UI để hiển thị snackbar thân thiện.
 * Tests cần viết: attach token, bắt 401, mapping error response.
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const axiosClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('slife_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      status: error?.response?.status,
      message: error?.response?.data?.message || error.message || 'Unknown error',
      fieldErrors: error?.response?.data?.fieldErrors || {},
      raw: error,
    };
    if (normalizedError.status === 401) {
      localStorage.removeItem('slife_access_token');
      window.location.href = '/login';
    }
    return Promise.reject(normalizedError);
  },
);
export default axiosClient;
