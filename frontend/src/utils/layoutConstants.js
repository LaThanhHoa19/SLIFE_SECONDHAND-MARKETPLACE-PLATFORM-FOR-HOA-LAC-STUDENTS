/**
 * SCRUM-93: Layout constants for consistent spacing and max-width across pages.
 * Use these in MainLayout, PageContainer, and page components.
 */
export const HEADER_HEIGHT = 64;
/** Khoảng cách giữa header và sidebar / content để không bị sát */
export const HEADER_GAP = 12;
export const SIDEBAR_TOP_OFFSET = HEADER_HEIGHT + HEADER_GAP;
export const SIDEBAR_WIDTH = 148;

/** Max width of main content area (feed, listing grid, etc.) */
export const CONTENT_MAX_WIDTH = 1200;

/** Horizontal and vertical padding applied to page content by MainLayout */
export const PAGE_PADDING_X = 2;
export const PAGE_PADDING_Y = 2.5;

/** Max width for narrow pages (forms, notifications list) */
export const NARROW_PAGE_MAX_WIDTH = 640;

/** Max width for detail pages (listing detail, profile content area) */
export const DETAIL_PAGE_MAX_WIDTH = 900;

/** Auth/form card max width (login, register) */
export const AUTH_CARD_MAX_WIDTH = 420;
