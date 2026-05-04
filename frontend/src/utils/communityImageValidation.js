import { COMMUNITY_POST_MAX_IMAGE_MB } from './communityPostLimits';

const MAX_BYTES = COMMUNITY_POST_MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * @param {File[]} files
 * @param {number} [maxCount] — số ảnh tối đa (nếu không truyền thì không giới hạn)
 * @param {number} [maxSizeMB] — dung lượng tối đa mỗi ảnh (MB), mặc định dùng constant
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateCommunityPostImages(files, maxCount, maxSizeMB) {
    if (!files || !files.length) {
        return { ok: false, message: 'Vui lòng chọn ảnh hợp lệ.' };
    }

    if (maxCount != null && files.length > maxCount) {
        return { ok: false, message: `Tối đa ${maxCount} ảnh.` };
    }

    const limit = (maxSizeMB != null ? maxSizeMB : COMMUNITY_POST_MAX_IMAGE_MB) * 1024 * 1024;

    for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return { ok: false, message: 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.' };
        }

        if (file.size > limit) {
            return { ok: false, message: `Ảnh phải nhỏ hơn ${maxSizeMB ?? COMMUNITY_POST_MAX_IMAGE_MB}MB.` };
        }
    }

    return { ok: true };
}

export const validateCommunityImage = validateCommunityPostImages;
