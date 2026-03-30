/**
 * SCRUM-93: Layout constants for consistent spacing and max-width across pages.
 * Use these in MainLayout, PageContainer, and page components.
 */
/** Nền vỏ app: MainLayout, Sidebar — dùng chung cho trang full-bleed (vd. đăng tin studio) */
export const APP_SHELL_BG = '#141225';

export const HEADER_HEIGHT = 64;
/** Khoảng cách giữa header và sidebar / content để không bị sát */
export const HEADER_GAP = 0;
export const SIDEBAR_TOP_OFFSET = HEADER_HEIGHT + HEADER_GAP;
export const SIDEBAR_WIDTH = 220; // Tăng một chút cho thoải mái nếu cần, hoặc giữ nguyên 184
export const SIDEBAR_MINI_WIDTH = 72;

/** Max width of main content area (feed, listing grid, etc.) */
export const CONTENT_MAX_WIDTH = 1200;

/**
 * MainLayout: không áp dụng CONTENT_MAX_WIDTH — nội dung trải full chiều ngang còn lại (sát sidebar).
 * Form studio: đăng tin mới, sửa tin, xuất bản từ nháp.
 */
export function isFullWidthMainRoute(pathname) {
    if (!pathname) return false;
    if (pathname === '/listings/new') return true;
    if (/^\/listings\/[^/]+\/edit$/.test(pathname)) return true;
    if (/^\/drafts\/[^/]+\/publish$/.test(pathname)) return true;
    return false;
}

/** Admin main column: full width của vùng còn lại (bảng rộng, không giới hạn 1200px). */
export const ADMIN_CONTENT_MAX_WIDTH = '100%';

/** Horizontal and vertical padding applied to page content by MainLayout */
export const PAGE_PADDING_X = 2;
export const PAGE_PADDING_Y = 2.5;

/** Max width for narrow pages (forms, notifications list) */
export const NARROW_PAGE_MAX_WIDTH = 640;

/** Max width for detail pages (listing detail, profile content area) */
export const DETAIL_PAGE_MAX_WIDTH = 900;

/** Auth/form card max width (login, register) */
export const AUTH_CARD_MAX_WIDTH = 420;
