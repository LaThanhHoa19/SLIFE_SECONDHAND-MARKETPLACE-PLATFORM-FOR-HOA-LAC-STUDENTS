import { useEffect, useState } from 'react';
import { getCommunityPostFormConfig } from '../api/communityApi';
import { unwrapApiData } from '../utils/apiPayload';

const FALLBACK = 10;
const CEILING = 50;

/** Giới hạn ảnh/bài từ GET /api/community/posts/form-config */
export function useMaxCommunityPostImages() {
    const [maxImages, setMaxImages] = useState(FALLBACK);

    useEffect(() => {
        let cancelled = false;
        getCommunityPostFormConfig()
            .then((res) => {
                if (cancelled) return;
                const d = unwrapApiData(res);
                const n = Number(d?.maxImagesPerPost);
                if (Number.isFinite(n) && n >= 1) {
                    setMaxImages(Math.min(CEILING, Math.floor(n)));
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    return maxImages;
}
