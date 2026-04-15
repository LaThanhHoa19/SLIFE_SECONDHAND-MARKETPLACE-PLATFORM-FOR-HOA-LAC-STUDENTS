/**
 * Hằng số và helper dùng chung cho trang "Tin đăng của tôi" (Stitch / dark UI).
 */
export const TABS = [
    { value: 'ACTIVE',   label: 'Đang đăng' },
    { value: 'HIDDEN',   label: 'Đã ẩn' },
    { value: 'DRAFT',    label: 'Bản nháp' },
    { value: 'EXPIRED',  label: 'Hết hạn' },
    { value: 'SOLD',     label: 'Đã bán' },
];

export const ALL_TAB_STATUSES = TABS.map((t) => t.value);

/** Nhãn badge trên ảnh (chữ hoa, ngắn). */
export const STATUS_BADGE_LABELS = {
    ACTIVE:     'ĐANG ĐĂNG',
    DRAFT:      'BẢN NHÁP',
    HIDDEN:     'ĐÃ ẨN',
    MOD_HIDDEN: 'BỊ ẨN VI PHẠM',
    SOLD:       'ĐÃ BÁN',
    GIVEN_AWAY: 'CHO TẶNG',
    BANNED:     'BỊ KHÓA',
    EXPIRED:    'HẾT HẠN',
    PENDING:    'CHỜ DUYỆT',
    REJECTED:   'TỪ CHỐI',
    REPORTED:   'BÁO CÁO',
    DELETED:    'ĐÃ XÓA',
};

/** Chuẩn hóa tab từ query `status` (back/forward, deep link). */
export function tabFromSearchParams(searchParams) {
    const raw = searchParams.get('status') || 'ACTIVE';
    return ALL_TAB_STATUSES.includes(raw) ? raw : 'ACTIVE';
}

/** Trang (0-based) từ query `page`. */
export function pageFromSearchParams(searchParams) {
    const raw = searchParams.get('page');
    const n = raw == null || raw === '' ? 0 : Number.parseInt(String(raw), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

export const STATUS_COLORS = {
    ACTIVE:     { bg: 'rgba(46,213,115,0.12)',  text: '#2ed573',  border: 'rgba(46,213,115,0.3)' },
    DRAFT:      { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.15)' },
    HIDDEN:     { bg: 'rgba(255,165,0,0.12)',   text: '#ffa500',  border: 'rgba(255,165,0,0.3)' },
    MOD_HIDDEN: { bg: 'rgba(255,99,71,0.13)',   text: '#ff7f6b',  border: 'rgba(255,99,71,0.35)' },
    SOLD:       { bg: 'rgba(157,110,237,0.15)', text: '#9D6EED',  border: 'rgba(157,110,237,0.35)' },
    GIVEN_AWAY: { bg: 'rgba(157,110,237,0.15)', text: '#9D6EED',  border: 'rgba(157,110,237,0.35)' },
    BANNED:     { bg: 'rgba(255,71,87,0.12)',   text: '#ff4757',  border: 'rgba(255,71,87,0.3)' },
    EXPIRED:    { bg: 'rgba(255,165,0,0.1)',    text: '#ffa500',  border: 'rgba(255,165,0,0.25)' },
    PENDING:    { bg: 'rgba(255,214,0,0.1)',    text: '#ffd700',  border: 'rgba(255,214,0,0.28)' },
    REJECTED:   { bg: 'rgba(255,71,87,0.1)',    text: '#ff4757',  border: 'rgba(255,71,87,0.25)' },
    REPORTED:   { bg: 'rgba(255,71,87,0.12)',   text: '#ff4757',  border: 'rgba(255,71,87,0.3)' },
    DELETED:    { bg: 'rgba(100,100,110,0.2)',  text: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.12)' },
};

export const STATUS_LABELS = {
    ACTIVE:     'Đang đăng',
    DRAFT:      'Bản nháp',
    HIDDEN:     'Đã ẩn',
    MOD_HIDDEN: 'Bị ẩn vi phạm',
    SOLD:       'Đã bán',
    GIVEN_AWAY: 'Đã tặng',
    BANNED:     'Bị khóa',
    PENDING:    'Chờ duyệt',
    REJECTED:   'Bị từ chối',
    EXPIRED:    'Hết hạn',
    REPORTED:   'Bị báo cáo',
    DELETED:    'Đã xóa',
};

export const PAGE_SIZE = 12;

/** Tím thương hiệu — khớp theme.palette.primary / ListingCard */
export const STITCH_PURPLE = '#9D6EED';
export const STITCH_PURPLE_DEEP = '#7B4FBF';

/** Nền trang — khớp MainLayout, Sidebar, uiTokens.surface.appHeader */
export const STITCH_BG = '#141225';
export const STITCH_PAGE_GRADIENT = 'linear-gradient(180deg, #171522 0%, #141225 45%, #141225 100%)';

/** Thẻ — khớp CARD_BG toàn dự án (#201D26) */
export const STITCH_CARD = '#201D26';
export const STITCH_CARD_BORDER = 'rgba(255,255,255,0.05)';

/** Giá trên thẻ (accent, giữ tách biệt với brand tím) */
export const STITCH_PRICE_CYAN = '#5CE1E6';

/** Thanh hành động dưới thẻ — theme.secondary.dark */
export const STITCH_ACTION_BAR_BG = '#1A1721';

/** Tab chưa chọn — chip tối kiểu Stitch (tách khỏi nền trang) */
export const STITCH_TAB_INACTIVE_BG = 'rgba(22, 24, 34, 0.96)';
export const STITCH_TAB_INACTIVE_BORDER = 'rgba(255,255,255,0.07)';

/** Tab đang chọn — accent tím Stitch (mockup GG Stitch), glow dưới pill */
export const STITCH_TAB_ACTIVE_GRADIENT =
    'linear-gradient(135deg, #9B7AFF 0%, #7C5CFC 48%, #6548E8 100%)';
export const STITCH_TAB_ACTIVE_BORDER = 'rgba(180, 150, 255, 0.45)';
export const STITCH_TAB_ACTIVE_SHADOW =
    '0 10px 36px rgba(124, 92, 252, 0.48), 0 2px 14px rgba(124, 92, 252, 0.28)';

export const toCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`;

/** True nếu listing còn trong vòng 7 ngày trước khi hết hạn (chưa expired). */
export const isRenewable = (expirationDate) => {
    if (!expirationDate) return false;
    const now = Date.now();
    const expiry = new Date(expirationDate).getTime();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};
