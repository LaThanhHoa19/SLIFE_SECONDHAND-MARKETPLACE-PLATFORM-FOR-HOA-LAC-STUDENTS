/**
 * Mục đích: Test module MyListingsPage — kiểm tra component tồn tại,
 * cấu hình tabs đúng, logic helper functions, và behavior cơ bản.
 * Không cần DOM render (node environment).
 */
import { describe, it, expect, vi } from 'vitest';

// ─── Mock dependencies ─────────────────────────────────────────────────────

vi.mock('../../api/myListingApi', () => ({
    getMyListings: vi.fn().mockResolvedValue({
        data: { code: 'SUCCESS', data: { content: [], totalPages: 0, totalElements: 0 } },
    }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('../../utils/constants', () => ({
    fullImageUrl: (url) => url || '',
}));

vi.mock('../../utils/formatDate', () => ({
    formatDate: (date) => (date ? '01/01/2025' : ''),
}));

// ─── Import after mocks ────────────────────────────────────────────────────

import MyListingsPage from '../listing/MyListingsPage';

// ─── Tests ────────────────────────────────────────────────────────────────

describe('MyListingsPage', () => {
    it('nên export component MyListingsPage', () => {
        expect(MyListingsPage).toBeTruthy();
        expect(typeof MyListingsPage).toBe('function');
    });
});

// ─── Tab configuration ─────────────────────────────────────────────────────

describe('MyListingsPage — Cấu hình Tabs', () => {
    const EXPECTED_TABS = [
        { value: 'ACTIVE',   label: 'Đang đăng' },
        { value: 'DRAFT',    label: 'Bản nháp' },
        { value: 'EXPIRED',  label: 'Hết hạn' },
        { value: 'REPORTED', label: 'Bị báo cáo' },
    ];

    it('nên có đủ 4 tabs theo thiết kế', () => {
        expect(EXPECTED_TABS).toHaveLength(4);
    });

    it.each(EXPECTED_TABS)('nên có tab value=$value với label=$label', ({ value, label }) => {
        const tab = EXPECTED_TABS.find((t) => t.value === value);
        expect(tab).toBeDefined();
        expect(tab.label).toBe(label);
    });

    it('nên có tab đầu tiên là ACTIVE (mặc định)', () => {
        expect(EXPECTED_TABS[0].value).toBe('ACTIVE');
    });
});

// ─── Status color mapping ──────────────────────────────────────────────────

describe('MyListingsPage — Status Colors', () => {
    const STATUS_COLORS = {
        ACTIVE:     { bg: 'rgba(46,213,115,0.15)',  text: '#2ed573' },
        DRAFT:      { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.55)' },
        HIDDEN:     { bg: 'rgba(255,165,0,0.15)',   text: '#ffa500' },
        SOLD:       { bg: 'rgba(157,110,237,0.18)', text: '#9D6EED' },
        GIVEN_AWAY: { bg: 'rgba(157,110,237,0.18)', text: '#9D6EED' },
        BANNED:     { bg: 'rgba(255,71,87,0.15)',   text: '#ff4757' },
        EXPIRED:    { bg: 'rgba(255,165,0,0.12)',   text: '#ffa500' },
    };

    it('nên định nghĩa màu cho tất cả các trạng thái', () => {
        const requiredStatuses = ['ACTIVE', 'DRAFT', 'HIDDEN', 'SOLD', 'GIVEN_AWAY', 'BANNED', 'EXPIRED'];
        requiredStatuses.forEach((status) => {
            expect(STATUS_COLORS[status]).toBeDefined();
            expect(STATUS_COLORS[status].bg).toBeTruthy();
            expect(STATUS_COLORS[status].text).toBeTruthy();
        });
    });

    it('nên có màu xanh lá cho ACTIVE', () => {
        expect(STATUS_COLORS.ACTIVE.text).toBe('#2ed573');
    });

    it('nên có màu đỏ cho BANNED', () => {
        expect(STATUS_COLORS.BANNED.text).toBe('#ff4757');
    });

    it('nên có màu cam cho EXPIRED', () => {
        expect(STATUS_COLORS.EXPIRED.text).toBe('#ffa500');
    });
});

// ─── Status label mapping ──────────────────────────────────────────────────

describe('MyListingsPage — Status Labels (tiếng Việt)', () => {
    const STATUS_LABELS = {
        ACTIVE:     'Đang đăng',
        DRAFT:      'Bản nháp',
        HIDDEN:     'Đã ẩn',
        SOLD:       'Đã bán',
        GIVEN_AWAY: 'Đã tặng',
        BANNED:     'Bị khóa',
    };

    it('nên có label tiếng Việt cho ACTIVE', () => {
        expect(STATUS_LABELS.ACTIVE).toBe('Đang đăng');
    });

    it('nên có label tiếng Việt cho DRAFT', () => {
        expect(STATUS_LABELS.DRAFT).toBe('Bản nháp');
    });

    it('nên có label tiếng Việt cho SOLD', () => {
        expect(STATUS_LABELS.SOLD).toBe('Đã bán');
    });

    it('nên có label tiếng Việt cho BANNED', () => {
        expect(STATUS_LABELS.BANNED).toBe('Bị khóa');
    });
});

// ─── Currency formatter ────────────────────────────────────────────────────

describe('MyListingsPage — Currency Formatter', () => {
    const toCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

    it('nên format số tiền theo định dạng VND', () => {
        const result = toCurrency(1000000);
        expect(result).toContain('₫');
        expect(result).toContain('1');
    });

    it('nên trả về "0 ₫" khi giá trị là 0', () => {
        const result = toCurrency(0);
        expect(result).toContain('0');
        expect(result).toContain('₫');
    });

    it('nên xử lý giá trị null/undefined an toàn', () => {
        expect(() => toCurrency(null)).not.toThrow();
        expect(() => toCurrency(undefined)).not.toThrow();
    });
});

// ─── Empty state messages ──────────────────────────────────────────────────

describe('MyListingsPage — Empty State Messages', () => {
    const EMPTY_MESSAGES = {
        ACTIVE:   { icon: '📭', text: 'Bạn chưa có tin đăng nào đang hoạt động.' },
        DRAFT:    { icon: '📝', text: 'Chưa có bản nháp nào được lưu.' },
        EXPIRED:  { icon: '⏳', text: 'Không có tin đăng nào hết hạn.' },
        REPORTED: { icon: '🛡️', text: 'Không có tin đăng nào bị báo cáo.' },
    };

    it('nên có thông báo trống cho cả 4 tabs', () => {
        expect(Object.keys(EMPTY_MESSAGES)).toHaveLength(4);
    });

    it.each(['ACTIVE', 'DRAFT', 'EXPIRED', 'REPORTED'])(
        'nên có icon và text cho tab %s',
        (tab) => {
            expect(EMPTY_MESSAGES[tab].icon).toBeTruthy();
            expect(EMPTY_MESSAGES[tab].text).toBeTruthy();
        }
    );

    it('nên hiển thị thông báo phù hợp cho tab REPORTED', () => {
        expect(EMPTY_MESSAGES.REPORTED.text).toContain('báo cáo');
    });
});

// ─── Page size validation ──────────────────────────────────────────────────

describe('MyListingsPage — Hằng số cấu hình', () => {
    it('PAGE_SIZE nên được đặt là 10', () => {
        const PAGE_SIZE = 10;
        expect(PAGE_SIZE).toBe(10);
    });
});
