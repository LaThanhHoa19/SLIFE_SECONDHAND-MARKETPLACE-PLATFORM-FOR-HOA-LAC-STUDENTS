/** Mục đích: hằng số frontend. */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Chuẩn hoá base URL để tránh gọi trùng /api/api khi env đã chứa hậu tố /api.
 * Ví dụ: http://localhost/api -> http://localhost
 */
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
export const PAGE_SIZES = [10, 20, 50];

/** URL đầy đủ cho ảnh (avatar, cover, listing) từ path backend trả về. */
export function fullImageUrl(url) {
  if (!url) return null;
  const normalized = String(url).trim().replace(/\\/g, '/');
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('//')) return `https:${normalized}`;

  const base = API_BASE_URL.replace(/\/$/, '');
  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${base}${path}`;
}
