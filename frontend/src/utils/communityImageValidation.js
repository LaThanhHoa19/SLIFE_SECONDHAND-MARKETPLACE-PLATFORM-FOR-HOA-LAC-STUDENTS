/**
 * Kiểm tra ảnh đính kèm bài cộng đồng trước khi gọi API — khớp CommunityPostImageService (JPG/PNG, 5MB).
 */
import { COMMUNITY_POST_MAX_IMAGE_MB } from './communityPostLimits';

const JPEG_PNG_MIME = /^image\/(jpeg|png)$/i;
const JPEG_PNG_EXT = /\.(jpe?g|png)$/i;

/**
 * @param {File[]} files
 * @param {number} maxCount
 * @param {number} [maxMb]
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateCommunityPostImages(files, maxCount, maxMb = COMMUNITY_POST_MAX_IMAGE_MB) {
    const list = Array.isArray(files) ? files.filter(Boolean) : [];
    if (list.length === 0) {
        return { ok: true };
    }
    if (list.length > maxCount) {
        return { ok: false, message: `Chỉ được đính kèm tối đa ${maxCount} ảnh.` };
    }
    const maxBytes = maxMb * 1024 * 1024;
    for (const f of list) {
        if (f.size <= 0) {
            return { ok: false, message: 'Có file ảnh không hợp lệ hoặc rỗng.' };
        }
        if (f.size > maxBytes) {
            return { ok: false, message: `Mỗi ảnh tối đa ${maxMb}MB. File "${f.name || 'ảnh'}" vượt quá giới hạn.` };
        }
        const type = (f.type || '').trim().toLowerCase();
        const name = f.name || '';
        const mimeOk = !type || JPEG_PNG_MIME.test(type);
        const extOk = JPEG_PNG_EXT.test(name);
        if (!mimeOk || !extOk) {
            return {
                ok: false,
                message: 'Chỉ chấp nhận ảnh JPG hoặc PNG (đuôi .jpg, .jpeg, .png).',
            };
        }
    }
    return { ok: true };
}
