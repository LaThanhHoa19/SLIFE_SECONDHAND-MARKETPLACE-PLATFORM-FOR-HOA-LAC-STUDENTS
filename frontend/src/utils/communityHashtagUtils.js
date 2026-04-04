/**
 * Hashtag trong mô tả cộng đồng — đồng bộ quy tắc với backend CommunityPostService:
 * # đứng sau đầu chuỗi hoặc ký tự không phải chữ/số/_/#; thân: Unicode chữ, số, _; không khoảng trắng / ký tự đặc biệt.
 */

const HASHTAG_SOURCE = '(^|[^#\\p{L}\\p{N}_])#([\\p{L}\\p{N}_]{1,100})(?=[^\\p{L}\\p{N}_]|$)';

/**
 * @returns {{ type: 'text' | 'tag', value: string }[]}
 */
export function splitDescriptionForRender(text) {
    const s = text == null ? '' : String(text);
    if (!s) return [{ type: 'text', value: '' }];

    const parts = [];
    let last = 0;
    const re = new RegExp(HASHTAG_SOURCE, 'gu');
    let m;
    while ((m = re.exec(s)) !== null) {
        const idx = m.index;
        const full = m[0];
        const prefix = m[1];
        if (idx > last) {
            parts.push({ type: 'text', value: s.slice(last, idx) });
        }
        if (prefix) {
            parts.push({ type: 'text', value: prefix });
        }
        parts.push({ type: 'tag', value: `#${m[2]}` });
        last = idx + full.length;
    }
    if (last < s.length) {
        parts.push({ type: 'text', value: s.slice(last) });
    }
    return parts.length > 0 ? parts : [{ type: 'text', value: s }];
}

/** Danh sách thân tag (giữ nguyên hoa thường gõ) để preview — tối đa `max` cái, không trùng (so khớp không phân biệt hoa thường). */
export function previewHashtagsFromDescription(text, max = 20) {
    const s = text == null ? '' : String(text);
    const seen = new Set();
    const ordered = [];
    const re = new RegExp(HASHTAG_SOURCE, 'gu');
    let m;
    while ((m = re.exec(s)) !== null) {
        const key = m[2].toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        ordered.push(m[2]);
        if (ordered.length >= max) break;
    }
    return ordered;
}
