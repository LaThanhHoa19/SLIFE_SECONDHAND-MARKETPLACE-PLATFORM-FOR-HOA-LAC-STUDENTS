/** Thời gian tương đối (kiểu Stitch: "2 GIỜ TRƯỚC"). */
export function formatRelativeTimeVi(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    let sec = Math.floor((Date.now() - t) / 1000);
    if (sec < 0) sec = 0;
    if (sec < 60) return 'VỪA XONG';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} PHÚT TRƯỚC`;
    const h = Math.floor(min / 60);
    if (h < 48) return `${h} GIỜ TRƯỚC`;
    const days = Math.floor(h / 24);
    if (days < 14) return `${days} NGÀY TRƯỚC`;
    const weeks = Math.floor(days / 7);
    return `${weeks} TUẦN TRƯỚC`;
}

const SORT_KEYS = ['newest', 'oldest', 'price_high', 'price_low'];

export function sortListings(listings, sortKey) {
    const key = SORT_KEYS.includes(sortKey) ? sortKey : 'newest';
    const arr = [...listings];
    const byCreated = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    const byCreatedAsc = (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    const byPriceDesc = (a, b) => Number(b.price || 0) - Number(a.price || 0);
    const byPriceAsc = (a, b) => Number(a.price || 0) - Number(b.price || 0);
    switch (key) {
        case 'oldest': arr.sort(byCreatedAsc); break;
        case 'price_high': arr.sort(byPriceDesc); break;
        case 'price_low': arr.sort(byPriceAsc); break;
        default: arr.sort(byCreated);
    }
    return arr;
}
