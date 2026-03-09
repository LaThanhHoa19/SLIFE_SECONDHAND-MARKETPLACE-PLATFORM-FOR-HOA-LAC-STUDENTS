/** Mục đích: hằng số frontend. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const PAGE_SIZES = [10, 20, 50];

/** URL đầy đủ cho ảnh (avatar, cover, listing) từ path backend trả về. */
export function fullImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/$/, '');
  return url.startsWith('/') ? base + url : base + '/' + url;
}
