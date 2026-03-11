/** Mục đích: hằng số frontend. */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Chuẩn hoá base URL để tránh gọi trùng /api/api khi env đã chứa hậu tố /api.
 * Ví dụ: http://localhost/api -> http://localhost
 */
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
export const PAGE_SIZES = [10, 20, 50];
