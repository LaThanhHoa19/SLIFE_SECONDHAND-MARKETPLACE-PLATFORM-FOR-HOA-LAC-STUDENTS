/**
 * Helpers dùng chung cho Quản lý báo cáo (admin).
 * Khớp backend ReportResponseDTO: targetPreview, status, targetType, ...
 *
 * Mock: mặc định TẮT — luôn gọi API thật. Chỉ bật mock khi VITE_ADMIN_REPORTS_MOCK=true
 * (ví dụ chỉnh UI không cần backend).
 */

const REPORT_MOCK_PATCH_KEY = 'slife_admin_report_mock_v1';

/** Dữ liệu mẫu UI — khớp shape ReportResponseDTO + _mock */
export const REPORT_ADMIN_MOCK_ROWS = [
    {
        reportId: 99001,
        reporterName: 'Nguyễn Văn An',
        reporterAvatarUrl: null,
        targetType: 'USER',
        targetId: 1001,
        targetPreview: 'Trần Thị Bình',
        listingId: null,
        conversationId: null,
        reason: 'Gửi link lừa đảo trong chat.',
        status: 'PENDING',
        adminNote: null,
        createdAt: '2026-03-10T09:15:00.000Z',
        _mock: true,
    },
    {
        reportId: 99002,
        reporterName: 'Lê Minh Tuấn',
        reporterAvatarUrl: null,
        targetType: 'LISTING',
        targetId: 2002,
        targetPreview: 'MacBook Air M1 cũ — còn bảo hành',
        listingId: 2002,
        conversationId: null,
        reason: 'Hình ảnh không khớp mô tả, nghi ngờ hàng nhái.',
        status: 'PENDING',
        adminNote: null,
        createdAt: '2026-03-11T14:22:00.000Z',
        _mock: true,
    },
    {
        reportId: 99003,
        reporterName: 'Phạm Thu Hà',
        reporterAvatarUrl: null,
        targetType: 'USER',
        targetId: 1003,
        targetPreview: 'Đỗ Quốc Huy',
        listingId: null,
        conversationId: null,
        reason: 'Spam tin nhắn quảng cáo ngoài phạm vi SLIFE.',
        status: 'RESOLVED',
        adminNote: 'Đã cảnh báo người dùng.',
        createdAt: '2026-03-12T08:40:00.000Z',
        _mock: true,
    },
    {
        reportId: 99004,
        reporterName: 'Hoàng Nam',
        reporterAvatarUrl: null,
        targetType: 'LISTING',
        targetId: 2004,
        targetPreview: 'iPhone 13 — pin chai',
        listingId: 2004,
        conversationId: null,
        reason: 'Giá niêm yết thấp bất thường, nghi ngờ scam.',
        status: 'PENDING',
        adminNote: null,
        createdAt: '2026-03-13T16:05:00.000Z',
        _mock: true,
    },
    {
        reportId: 99005,
        reporterName: 'Vũ Khánh Linh',
        reporterAvatarUrl: null,
        targetType: 'COMMENT',
        targetId: 5005,
        targetPreview: 'Bình luận xúc phạm người mua…',
        listingId: 2010,
        conversationId: null,
        reason: 'Nội dung comment vi phạm cộng đồng.',
        status: 'PENDING',
        adminNote: null,
        createdAt: '2026-03-14T11:30:00.000Z',
        _mock: true,
    },
    {
        reportId: 99006,
        reporterName: 'Bùi Gia Bảo',
        reporterAvatarUrl: null,
        targetType: 'MESSAGE',
        targetId: 6006,
        targetPreview: 'Chuyển khoản trước mới giao hàng…',
        listingId: 2011,
        conversationId: 88,
        reason: 'Tin nhắn yêu cầu thanh toán ngoài nền tảng.',
        status: 'REJECTED',
        adminNote: 'Không đủ bằng chứng.',
        createdAt: '2026-03-14T18:00:00.000Z',
        _mock: true,
    },
];

export function isReportAdminMockEnabled() {
    return import.meta.env.VITE_ADMIN_REPORTS_MOCK === 'true';
}

export function isMockReportRow(row) {
    return row?._mock === true;
}

function readReportMockPatches() {
    try {
        const raw = sessionStorage.getItem(REPORT_MOCK_PATCH_KEY);
        if (!raw) return {};
        const p = JSON.parse(raw);
        return typeof p === 'object' && p !== null ? p : {};
    } catch {
        return {};
    }
}

export function writeReportMockPatch(reportId, patch) {
    const id = String(reportId);
    const all = readReportMockPatches();
    all[id] = { ...(all[id] || {}), ...patch };
    sessionStorage.setItem(REPORT_MOCK_PATCH_KEY, JSON.stringify(all));
}

export function getReportAdminMockDataset() {
    const patches = readReportMockPatches();
    return REPORT_ADMIN_MOCK_ROWS.map((r) => {
        const id = r.reportId ?? r.id;
        const extra = id != null ? patches[String(id)] : null;
        return extra ? { ...r, ...extra } : { ...r };
    });
}

export function findReportAdminMockById(id) {
    const n = Number(id);
    if (!Number.isFinite(n)) return null;
    return getReportAdminMockDataset().find((r) => reportRowId(r) === n) ?? null;
}

/**
 * Phân trang mock client-side (tab + trạng thái).
 * statusFilter: 'ALL' | 'PENDING' | 'RESOLVED' | 'REJECTED'
 */
export function paginateReportAdminMocks({ targetTypeTab, statusFilter, page, size }) {
    let rows = getReportAdminMockDataset();
    rows = rows.filter((r) => reportCategoryTab(r) === targetTypeTab);
    if (statusFilter !== 'ALL') {
        const s = String(statusFilter).toUpperCase();
        rows = rows.filter((r) => (r.status || '').toUpperCase() === s);
    }
    rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const totalElements = rows.length;
    const start = Math.max(0, page) * size;
    const content = rows.slice(start, start + size);
    return {
        content,
        totalElements,
        totalPages: totalElements === 0 ? 0 : Math.ceil(totalElements / size),
        number: page,
        size,
    };
}

export function formatReportDate(dateValue) {
    if (!dateValue) return '—';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN');
}

/** Hiển thị đích báo cáo (title user, preview comment/message, …). */
export function reportedDisplay(row) {
    const v =
        row?.targetPreview ??
        row?.target_preview ??
        row?.reportedDisplayName ??
        row?.reported_display_name;
    if (v == null || String(v).trim() === '') return '—';
    return String(v);
}

export function statusLabel(status) {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') return 'Chờ xử lý';
    if (s === 'RESOLVED') return 'Đã xử lý';
    if (s === 'REJECTED') return 'Từ chối';
    if (s === 'DISMISSED') return 'Đã bỏ qua';
    return status || '—';
}

export function statusChipSx(status) {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') {
        return { bgcolor: 'rgba(234,179,8,0.12)', color: '#facc15' };
    }
    if (s === 'RESOLVED') {
        return { bgcolor: 'rgba(34,197,94,0.12)', color: '#4ade80' };
    }
    if (s === 'REJECTED') {
        return { bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171' };
    }
    if (s === 'DISMISSED') {
        return { bgcolor: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
    }
    return { bgcolor: 'rgba(148,163,184,0.12)', color: '#cbd5e1' };
}

export function isPendingRow(row) {
    const s = (row?.status || 'PENDING').toUpperCase();
    return s === 'PENDING';
}

export function reportRowId(row) {
    return row?.reportId ?? row?.id;
}

const RAW_TYPE = (row) => String(row?.targetType ?? row?.target_type ?? '').toUpperCase();

/** Tab filter: LISTING | USER | OTHER (COMMENT + MESSAGE). */
export function reportCategoryTab(row) {
    const t = RAW_TYPE(row);
    if (t === 'LISTING' || t === 'POST') return 'LISTING';
    if (t === 'USER') return 'USER';
    return 'OTHER';
}

/** Nhãn hiển thị theo loại đích API (thân thiện cho admin). */
export function targetTypeLabel(targetType) {
    const t = String(targetType || '').toUpperCase();
    if (t === 'LISTING' || t === 'POST') return 'Tin đăng';
    if (t === 'USER') return 'Người dùng';
    if (t === 'COMMENT') return 'Bình luận';
    if (t === 'MESSAGE') return 'Tin nhắn';
    return 'Đối tượng';
}

/** Nhãn cột / mô tả theo loại đích API. */
export function targetSubjectLabel(targetType) {
    const t = String(targetType || '').toUpperCase();
    if (t === 'LISTING' || t === 'POST') return 'Tin đăng bị báo cáo';
    if (t === 'USER') return 'Người bị báo cáo';
    if (t === 'COMMENT') return 'Bình luận bị báo cáo';
    if (t === 'MESSAGE') return 'Tin nhắn bị báo cáo';
    return 'Đối tượng bị báo cáo';
}

import { fullImageUrl } from '../../utils/constants';

export function reporterAvatarUrl(row) {
    const raw =
        row?.reporterAvatarUrl ??
        row?.reporter_avatar_url ??
        row?.reporterAvatar ??
        row?.reporter_avatar ??
        row?.avatarUrl ??
        row?.avatar_url ??
        row?.reporter?.avatarUrl ??
        row?.reporter?.avatar_url ??
        row?.reporter?.avatar ??
        null;
    return fullImageUrl(raw);
}

/** Parse Spring Data Page từ BaseResponse. */
export function extractSpringPage(response) {
    const payload = response?.data?.data ?? response?.data;
    if (!payload || !Array.isArray(payload.content)) {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    }
    return {
        content: payload.content,
        totalElements: Number(payload.totalElements) || 0,
        totalPages: Number(payload.totalPages) || 0,
        number: Number(payload.number) || 0,
        size: Number(payload.size) || 20,
    };
}
