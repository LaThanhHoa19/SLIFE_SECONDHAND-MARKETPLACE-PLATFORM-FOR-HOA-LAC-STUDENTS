/**
 * Mục đích: fetch listings + debounce keyword.
 * API dùng: GET /api/listings?q=&category=&sort=&page=&size=.
 * Expose: data, meta, isLoading, error, refetch, params, setParams.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {getListings} from '../api/listingApi';
import {formatPickupDisplayLine} from '../utils/addressDisplay';
import useDebounce from './useDebounce';

const toBoolean = (value) => value === true || value === 1 || value === '1';

const normalizeSeller = (item) => {
    const sellerSummary = item?.sellerSummary ?? item?.seller_summary;
    if (sellerSummary && typeof sellerSummary === 'object') return sellerSummary;

    const seller = item?.seller;
    if (seller && typeof seller === 'object') return seller;

    const fallbackName = sellerSummary || item?.sellerName || item?.seller_name;
    return fallbackName ? {fullName: fallbackName} : {};
};

const normalizeImages = (item) => {
    const raw = item?.images ?? item?.imageUrls ?? item?.image_urls ?? item?.listingImages ?? item?.listing_images;
    if (Array.isArray(raw) && raw.length > 0) {
        return raw
            .map((img) => {
                if (typeof img === 'string') return img;
                if (img && typeof img === 'object') return img.imageUrl || img.image_url || '';
                return '';
            })
            .filter(Boolean);
    }
    // ListingCardResponse từ GET /api/listings trả về thumbnailUrl thay vì mảng images
    if (item?.thumbnailUrl) return [item.thumbnailUrl];
    return [];
};

const normalizeListing = (item) => {
    const pickupAddress = item?.pickupAddress ?? item?.pickup_address;
    const locationFromAddress = typeof pickupAddress === 'object'
        ? formatPickupDisplayLine(
            pickupAddress?.locationName ?? pickupAddress?.location_name,
            pickupAddress?.addressText ?? pickupAddress?.address_text,
        )
        : pickupAddress;
    const purpose = item?.purpose ?? item?.listingType ?? item?.listing_type;
    const isGiveaway = toBoolean(item?.isGiveaway ?? item?.is_giveaway) || purpose === 'GIVEAWAY';

    return {
        ...item,
        id: item?.id ?? item?.listingId ?? item?.listing_id,
        sellerId: item?.sellerId ?? item?.seller_id,
        title: item?.title ?? item?.name ?? '',
        description: item?.description ?? item?.content ?? '',
        price: item?.price ?? item?.amount ?? 0,
        itemCondition: item?.itemCondition ?? item?.item_condition ?? item?.condition ?? '',
        status: item?.status ?? '',
        isGiveaway,
        purpose,
        location: item?.location ?? item?.locationName ?? item?.location_name ?? locationFromAddress ?? '',
        createdAt: item?.createdAt ?? item?.created_at,
        images: normalizeImages(item),
        sellerSummary: normalizeSeller(item),
    };
};

const normalizeParams = (params = {}, query = '') => ({
    ...params,
    page: Number.isFinite(Number(params?.page)) ? Number(params.page) : 0,
    size: Number.isFinite(Number(params?.size)) ? Number(params.size) : 10,
    category: params?.category === '' || params?.category === null || params?.category === undefined
        ? null
        : Number.isNaN(Number(params.category))
            ? params.category
            : Number(params.category),
    q: query,
});


const MIN_LOADING_MS = 320;

export default function useListings(initialParams = {}) {
    const [params, setParams] = useState({page: 0, size: 10, ...initialParams});
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({totalPages: 0, totalElements: 0});
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debouncedQuery = useDebounce(params.q);
    const abortRef = useRef(null);

    // Đồng bộ params từ URL khi user đổi category/location/search
    useEffect(() => {
        setParams((prev) => {
            const next = {
                ...prev,
                page: Number.isFinite(Number(initialParams?.page)) ? Number(initialParams.page) : prev.page,
                size: Number.isFinite(Number(initialParams?.size)) ? Number(initialParams.size) : prev.size,
                category: initialParams?.category ?? prev.category,
                location: initialParams?.location ?? prev.location,
                sort: initialParams?.sort ?? prev.sort,
                q: initialParams?.q ?? prev.q,
            };
            const same =
                next.page === prev.page && next.size === prev.size && next.category === prev.category &&
                next.location === prev.location && next.sort === prev.sort && next.q === prev.q;
            return same ? prev : next;
        });
    }, [initialParams?.category, initialParams?.location, initialParams?.sort, initialParams?.page, initialParams?.size, initialParams?.q]);

    const fetchData = useCallback(async (currentParams, query) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const loadingStarted = Date.now();
        setLoading(true);
        setError(null);
        try {
            const {data: res} = await getListings(
                normalizeParams(currentParams, query),
                {signal: controller.signal},
            );
            if (controller.signal.aborted) return;

            // Backend current contract: { code, message, data: { content, totalPages, totalElements, ... } }
            // Fallback to legacy payloads for compatibility.
            const payload = res?.data ?? res;
            const list = Array.isArray(payload?.content)
                ? payload.content
                : Array.isArray(payload)
                    ? payload
                    : [];
            setData(list.map(normalizeListing));
            setMeta({
                totalPages: payload?.totalPages ?? 1,
                totalElements: payload?.totalElements ?? list.length,
            });
        } catch (err) {
            if (err?.name === 'CanceledError' || controller.signal.aborted) return;
            const isNetwork = !err?.status && !err?.response;
            setError({
                variant: isNetwork ? 'network' : 'generic',
                message: err?.message || 'Tải danh sách thất bại.',
            });
        } finally {
            if (controller.signal.aborted) return;
            const elapsed = Date.now() - loadingStarted;
            const delay = Math.max(0, MIN_LOADING_MS - elapsed);
            if (delay > 0) {
                await new Promise((r) => setTimeout(r, delay));
            }
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(params, debouncedQuery);
    }, [params.page, params.size, params.category, params.location, params.sort, debouncedQuery, fetchData]);

    const refetch = useCallback(() => {
        fetchData(params, debouncedQuery);
    }, [fetchData, params, debouncedQuery]);

    return {data, meta, isLoading, error, refetch, params, setParams};
}
