/**
 * Tin listing không còn xem được trên chợ (deep link từ thông báo, v.v.).
 */

export const CATALOG_UNAVAILABLE_MESSAGE = 'Tin đã hết hạn hoặc đã bị gỡ.';

/** Trạng thái tin vẫn công khai trên catalog (người xem không phải chủ tin). */
export function isListingPublicCatalogActive(listing) {
    if (!listing) return false;
    const s = String(listing?.status || listing?.itemStatus || '').toUpperCase();
    return s === 'ACTIVE';
}

export function getListingOwnerId(listing) {
    if (!listing) return null;
    return listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id ?? listing?.sellerId ?? null;
}

/**
 * Deep link từ thông báo: người nhận không phải chủ tin và tin không còn ACTIVE → hiển thị màn hình/thông báo gỡ.
 */
export function shouldShowCatalogUnavailableForNotifLink(listing, currentUser, fromNotification) {
    if (!fromNotification) return false;
    const ownerId = getListingOwnerId(listing);
    const viewerId = currentUser?.id != null ? String(currentUser.id) : null;
    const isOwner = viewerId && ownerId != null && String(ownerId) === viewerId;
    if (isOwner) return false;
    return !isListingPublicCatalogActive(listing);
}
