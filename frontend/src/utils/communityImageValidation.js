import { COMMUNITY_POST_MAX_IMAGE_MB } from './communityPostLimits';

const MAX_BYTES = COMMUNITY_POST_MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateCommunityPostImages(files) {
    if (!files || !files.length) {
        return 'Vui lòng chọn ảnh hợp lệ.';
    }

    for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.';
        }

        if (file.size > MAX_BYTES) {
            return `Ảnh phải nhỏ hơn ${COMMUNITY_POST_MAX_IMAGE_MB}MB.`;
        }
    }

    return null;
}

export const validateCommunityImage = validateCommunityPostImages;
