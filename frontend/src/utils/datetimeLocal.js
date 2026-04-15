/**
 * Chuỗi "YYYY-MM-DDTHH:mm" (datetime-local) → Date theo giờ địa phương.
 */
function parseDatetimeLocalToDate(dtLocal) {
    if (!dtLocal || typeof dtLocal !== 'string') return null;
    const trimmed = dtLocal.trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
    if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const day = Number(m[3]);
        const hh = Number(m[4]);
        const mm = Number(m[5]);
        const ss = m[6] != null ? Number(m[6]) : 0;
        const d = new Date(y, mo - 1, day, hh, mm, ss, 0);
        return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
}

function formatDateToDatetimeLocalValue(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Nếu user chọn cùng một ngày nhưng giờ đã qua (vd tối 21:44 mà chọn trưa 12:44),
 * coi như ý định là ngày kế tiếp cùng giờ — cộng ngày cho đến khi > hiện tại.
 */
export function bumpDatetimeLocalUntilFuture(dtLocal) {
    if (!dtLocal || !String(dtLocal).trim()) return dtLocal;
    let d = parseDatetimeLocalToDate(dtLocal);
    if (!d) return dtLocal;
    const now = Date.now();
    let guard = 0;
    while (d.getTime() <= now && guard < 400) {
        d.setDate(d.getDate() + 1);
        guard += 1;
    }
    return formatDateToDatetimeLocalValue(d);
}
