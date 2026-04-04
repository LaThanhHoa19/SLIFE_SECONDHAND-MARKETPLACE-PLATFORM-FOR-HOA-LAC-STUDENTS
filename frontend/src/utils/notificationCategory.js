/**
 * Phân loại thông báo cho UI (chip/tab kiểu Chợ Tốt).
 * Không cần migration DB: backend chỉ dùng ENUM cũ (MESSAGE, SYSTEM, …), tách nhánh bằng refType.
 */

export const NOTIF_TAB = {
    ALL: 'all',
    MESSAGE: 'message',
    OFFER: 'offer',
    COMMENT: 'comment',
    PUBLISH: 'publish',
};

/** Thứ tự chip (dropdown + trang thông báo). */
export const NOTIF_TABS_ORDER = [
    NOTIF_TAB.ALL,
    NOTIF_TAB.MESSAGE,
    NOTIF_TAB.OFFER,
    NOTIF_TAB.COMMENT,
    NOTIF_TAB.PUBLISH,
];

/** ?tab=message | offer | … — đồng bộ với NOTIF_TAB. */
export function tabFromSearchParam(param) {
    if (param == null || param === '' || param === NOTIF_TAB.ALL) return NOTIF_TAB.ALL;
    const allowed = new Set(NOTIF_TABS_ORDER);
    return allowed.has(param) ? param : NOTIF_TAB.ALL;
}

/** Nhãn hiển thị chip */
export const NOTIF_TAB_LABELS = {
    [NOTIF_TAB.ALL]: 'Tất cả',
    [NOTIF_TAB.MESSAGE]: 'Tin nhắn',
    [NOTIF_TAB.OFFER]: 'Trả giá',
    [NOTIF_TAB.COMMENT]: 'Bình luận',
    [NOTIF_TAB.PUBLISH]: 'Duyệt tin',
};

/**
 * @returns {keyof NOTIF_TAB | 'other'}
 */
export function deriveNotificationTab(n) {
    const type = String(n?.type || '').toUpperCase();
    const ref = String(n?.refType || '').toUpperCase();
    const content = String(n?.content || '');

    if (type === 'MESSAGE' && ref === 'CONVERSATION') return NOTIF_TAB.MESSAGE;
    /** Chat: refId = message_id, refType MESSAGE — vẫn là thông báo tin nhắn. */
    if (type === 'MESSAGE' && ref === 'MESSAGE') return NOTIF_TAB.MESSAGE;
    if (type === 'MESSAGE' && ref === 'LISTING') return NOTIF_TAB.COMMENT;

    if (type === 'SYSTEM' && ref === 'LISTING_PUBLISHED') return NOTIF_TAB.PUBLISH;
    /** Đề xuất giá (refType OFFER / fallback nội dung cũ). */
    if (type === 'SYSTEM' && ref === 'OFFER') return NOTIF_TAB.OFFER;
    if (type === 'SYSTEM' && ref === 'OFFER_REJECT') return NOTIF_TAB.OFFER;
    if (type === 'SYSTEM' && ref === 'LISTING' && content.includes('đề xuất giá')) return NOTIF_TAB.OFFER;

    if (type === 'COMMENT') return NOTIF_TAB.COMMENT;
    if (type === 'OFFER') return NOTIF_TAB.OFFER;
    /** Chấp nhận trả giá / deal — cùng tab Trả giá. */
    if (type === 'DEAL') return NOTIF_TAB.OFFER;
    if (type === 'LISTING_APPROVAL') return NOTIF_TAB.PUBLISH;

    return 'other';
}

export function notificationsForTab(list, tab) {
    const arr = Array.isArray(list) ? list : [];
    if (tab === NOTIF_TAB.ALL) return arr;
    return arr.filter((n) => deriveNotificationTab(n) === tab);
}

export function countForTab(list, tab) {
    return notificationsForTab(list, tab).length;
}
