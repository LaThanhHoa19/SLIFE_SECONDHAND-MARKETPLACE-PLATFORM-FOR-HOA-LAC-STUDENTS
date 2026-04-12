/**
 * Lưu refresh token trong localStorage (cùng origin S3) khi cookie HttpOnly không gửi được cross-site.
 * Dùng localStorage thay vì sessionStorage để tab mới vẫn đọc được refresh (sessionStorage tách theo tab).
 * Rủi ro XSS cao hơn — logout phải gọi clearPersistedRefreshToken.
 */
const REFRESH_KEY = 'slife_refresh_token';

export function getPersistedRefreshToken() {
  try {
    let v = localStorage.getItem(REFRESH_KEY);
    if (!v?.trim()) {
      const legacy = sessionStorage.getItem(REFRESH_KEY);
      if (legacy?.trim()) {
        v = legacy.trim();
        localStorage.setItem(REFRESH_KEY, v);
        sessionStorage.removeItem(REFRESH_KEY);
      }
    }
    return typeof v === 'string' && v.trim() ? v.trim() : '';
  } catch {
    return '';
  }
}

export function setPersistedRefreshToken(token) {
  try {
    if (token && String(token).trim()) {
      const t = String(token).trim();
      localStorage.setItem(REFRESH_KEY, t);
      sessionStorage.removeItem(REFRESH_KEY);
    } else {
      localStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearPersistedRefreshToken() {
  setPersistedRefreshToken(null);
}
