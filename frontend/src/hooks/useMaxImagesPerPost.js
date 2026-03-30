import { useEffect, useState } from 'react';
import { getListingFormConfig } from '../api/listingApi';
import { unwrapApiData } from '../utils/apiPayload';

const FALLBACK = 10;
const CEILING = 50;

/**
 * Giới hạn ảnh/tin từ GET /api/listings/form-config (MAX_IMAGES_PER_POST trên BE).
 * Dùng ngay khi user chọn ảnh — khớp validate lúc đăng tin.
 */
export function useMaxImagesPerPost() {
    const [maxImagesPerPost, setMaxImagesPerPost] = useState(FALLBACK);

    useEffect(() => {
        let cancelled = false;
        getListingFormConfig()
            .then((res) => {
                if (cancelled) return;
                const d = unwrapApiData(res);
                const n = Number(d?.maxImagesPerPost);
                if (Number.isFinite(n) && n >= 1) {
                    setMaxImagesPerPost(Math.min(CEILING, Math.floor(n)));
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    return maxImagesPerPost;
}
