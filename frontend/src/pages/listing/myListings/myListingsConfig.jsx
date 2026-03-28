/**
 * Hằng số và helper dùng chung cho trang "Tin đăng của tôi".
 */
import {
    Block as RejectedIcon,
    CheckCircleOutline as ActiveIcon,
    EditOutlined as EditIcon,
    ErrorOutline as ReportedIcon,
    HourglassEmpty as ExpiredIcon,
    Schedule as PendingIcon,
    VisibilityOff as HideIcon,
} from '@mui/icons-material';

export const TABS = [
    { value: 'ACTIVE',   label: 'Đang đăng',   icon: <ActiveIcon   sx={{ fontSize: 14 }} /> },
    { value: 'HIDDEN',   label: 'Đã ẩn',        icon: <HideIcon     sx={{ fontSize: 14 }} /> },
    { value: 'DRAFT',    label: 'Bản nháp',     icon: <EditIcon     sx={{ fontSize: 14 }} /> },
    { value: 'EXPIRED',  label: 'Hết hạn',      icon: <ExpiredIcon  sx={{ fontSize: 14 }} /> },
    { value: 'PENDING',  label: 'Chờ duyệt',    icon: <PendingIcon  sx={{ fontSize: 14 }} /> },
    { value: 'REJECTED', label: 'Bị từ chối',   icon: <RejectedIcon sx={{ fontSize: 14 }} /> },
    { value: 'REPORTED', label: 'Bị báo cáo',   icon: <ReportedIcon sx={{ fontSize: 14 }} /> },
];

export const ALL_TAB_STATUSES = TABS.map((t) => t.value);

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
    SOLD:       { bg: 'rgba(157,110,237,0.15)', text: '#9D6EED',  border: 'rgba(157,110,237,0.35)' },
    GIVEN_AWAY: { bg: 'rgba(157,110,237,0.15)', text: '#9D6EED',  border: 'rgba(157,110,237,0.35)' },
    BANNED:     { bg: 'rgba(255,71,87,0.12)',   text: '#ff4757',  border: 'rgba(255,71,87,0.3)' },
    EXPIRED:    { bg: 'rgba(255,165,0,0.1)',    text: '#ffa500',  border: 'rgba(255,165,0,0.25)' },
    PENDING:    { bg: 'rgba(255,214,0,0.1)',    text: '#ffd700',  border: 'rgba(255,214,0,0.28)' },
    REJECTED:   { bg: 'rgba(255,71,87,0.1)',    text: '#ff4757',  border: 'rgba(255,71,87,0.25)' },
    REPORTED:   { bg: 'rgba(255,71,87,0.12)',   text: '#ff4757',  border: 'rgba(255,71,87,0.3)' },
};

export const STATUS_LABELS = {
    ACTIVE:     'Đang đăng',
    DRAFT:      'Bản nháp',
    HIDDEN:     'Đã ẩn',
    SOLD:       'Đã bán',
    GIVEN_AWAY: 'Đã tặng',
    BANNED:     'Bị khóa',
    PENDING:    'Chờ duyệt',
    REJECTED:   'Bị từ chối',
    EXPIRED:    'Hết hạn',
    REPORTED:   'Bị báo cáo',
};

export const PAGE_SIZE = 10;

export const toCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

/** True nếu listing còn trong vòng 7 ngày trước khi hết hạn (chưa expired). */
export const isRenewable = (expirationDate) => {
    if (!expirationDate) return false;
    const now = Date.now();
    const expiry = new Date(expirationDate).getTime();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};
