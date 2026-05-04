/**
 * Tiện ích định dạng thông tin Tin đăng (Listing)
 * Giúp đồng bộ hóa hiển thị giữa Feed, Profile và Chi tiết bài đăng.
 */

export const BRAND_COLORS = {
    PURPLE: '#9D6EED',
    RED: '#FF4757',
    GREEN: '#2ED573',
    ORANGE: '#FFA502',
    TEAL: '#1DD3B0',
    GRAY: '#9AA0A6',
    TEXT_PRI: 'rgba(255,255,255,0.95)',
    TEXT_SEC: 'rgba(255,255,255,0.55)',
};

export const CONDITION_MAP = {
    NEW: { label: 'Mới', color: BRAND_COLORS.GREEN },
    USED_LIKE_NEW: { label: 'Đã dùng', color: BRAND_COLORS.PURPLE },
    USED_GOOD: { label: 'Đã dùng', color: BRAND_COLORS.PURPLE },
    USED_FAIR: { label: 'Đã dùng', color: BRAND_COLORS.PURPLE },
    USED: { label: 'Đã dùng', color: BRAND_COLORS.PURPLE },
};

/** Lấy thông tin tình trạng hàng (nhãn, màu sắc, icon mặc định) */
export const getConditionInfo = (condition) => {
    const raw = String(condition || '').toUpperCase();
    return CONDITION_MAP[raw] || { label: condition || 'Không rõ', color: BRAND_COLORS.TEXT_SEC };
};

/** Định dạng giá tiền VNĐ */
export const formatCurrency = (value) =>
    value == null ? '—' : `${Number(value).toLocaleString('vi-VN')} ₫`;

/**
 * Định dạng thời gian rút gọn: "1m", "5h", "3d", "12 thg 3"
 * @param {string|Date} value
 * @returns {string}
 */
export const formatRelativeShort = (value) => {
    if (!value) return 'Vừa đăng';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Vừa đăng';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
};

/** Lấy thông tin về mục đích (Cho tặng hoặc Bán) */
export const getPurposeInfo = (isGiveaway, price) => {
    if (isGiveaway) {
        return {
            label: 'Cho tặng miễn phí',
            color: BRAND_COLORS.GREEN,
            priceText: 'Cho tặng miễn phí',
            isFree: true
        };
    }

    return {
        label: 'Cần bán',
        color: BRAND_COLORS.RED,
        priceText: formatCurrency(price),
        isFree: false
    };
};

/** Các biểu tượng Icon tiêu chuẩn (Emoji) */
export const LISTING_ICONS = {
    CONDITION: '🏷',
    LOCATION: '📍',
    TIME: '🕒',
    STATUS: '📢',
};

/** Mapping trạng thái tin đăng (Active, Sold, etc.) */
export const LISTING_STATUS_MAP = {
    ACTIVE: { label: 'Đang bán', color: BRAND_COLORS.TEAL },
    SOLD: { label: 'Đã bán', color: BRAND_COLORS.RED },
    GIVEN_AWAY: { label: 'Đã tặng', color: BRAND_COLORS.GREEN },
    HIDDEN: { label: 'Đã ẩn', color: BRAND_COLORS.TEXT_SEC },
    EXPIRED: { label: 'Hết hạn', color: BRAND_COLORS.ORANGE },
};

/** Lấy thông tin trạng thái tin đăng */
export const getStatusInfo = (status) => {
    const raw = String(status || 'ACTIVE').toUpperCase();
    return LISTING_STATUS_MAP[raw] || { label: status, color: BRAND_COLORS.TEXT_SEC };
};

/** ID người bán trên payload listing (feed/search) — khớp logic ListingCard. */
export function getSellerIdFromListingItem(item) {
    if (!item || typeof item !== 'object') return undefined;
    const s = item.sellerSummary ?? item.seller;
    return (
        item.sellerId ??
        item.seller_id ??
        (s && typeof s === 'object' ? s.userId ?? s.id : undefined) ??
        item.seller?.id ??
        item.seller?.userId
    );
}
