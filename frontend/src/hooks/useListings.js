/**
 * Mục đích: fetch listings + debounce keyword + infinite scroll.
 * API dùng: GET /api/listings?q=&category=&sort=&page=&size=.
 * Expose: data, meta, isLoading, isLoadingMore, hasMore, error, refetch, loadMore, params, setParams.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getListings, searchListings } from '../api/listingApi';
import { getCategories } from '../api/categoryApi';
import { formatPickupDisplayLine } from '../utils/addressDisplay';
import { buildCategoryTree } from '../utils/categoryTree';
import { getSellerIdFromListingItem } from '../utils/listingFormatUtils';
import useDebounce from './useDebounce';

const toBoolean = (value) => value === true || value === 1 || value === '1';

const normalizeSeller = (item) => {
    const sellerSummary = item?.sellerSummary ?? item?.seller_summary;
    if (sellerSummary && typeof sellerSummary === 'object') return sellerSummary;

    const seller = item?.seller;
    if (seller && typeof seller === 'object') return seller;

    const fallbackName = sellerSummary || item?.sellerName || item?.seller_name;
    const avatar = item?.sellerAvatarUrl ?? item?.seller_avatar_url;
    return fallbackName
        ? { fullName: fallbackName, avatarUrl: avatar }
        : avatar
            ? { avatarUrl: avatar }
            : {};
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

const toNumericOrRaw = (value) => (
    value === '' || value === null || value === undefined
        ? null
        : Number.isNaN(Number(value))
            ? value
            : Number(value)
);

const normalizeParams = (params = {}, query = '') => ({
    ...params,
    page: Number.isFinite(Number(params?.page)) ? Number(params.page) : 0,
    size: Number.isFinite(Number(params?.size)) ? Number(params.size) : 10,
    category: toNumericOrRaw(params?.category),
    subcategory: toNumericOrRaw(params?.subcategory),
    q: query,
    prioritizeFollowing: params?.prioritizeFollowing !== false,
});

const normalizeConditionParam = (condition) => {
    if (!condition) return undefined;
    return String(condition).trim().toUpperCase();
};

const applyFeedTypeClientFilter = (items, feedType) => {
    const list = Array.isArray(items) ? items : [];
    const type = String(feedType || '').toUpperCase();

    if (!type || type === 'ALL') {
        return list;
    }

    if (type === 'GIVEAWAY') {
        return list.filter((item) => {
            const purpose = String(item?.purpose || '').toUpperCase();
            return item?.isGiveaway || purpose === 'GIVEAWAY';
        });
    }

    if (type === 'FOLLOWING') {
        return list.filter((item) => Boolean(item?.isFollowed));
    }

    if (type === 'POPULAR') {
        return [...list].sort((a, b) => {
            const likeA = Number(a?.likeCount || 0);
            const likeB = Number(b?.likeCount || 0);
            if (likeB !== likeA) return likeB - likeA;
            const timeA = new Date(a?.createdAt || 0).getTime();
            const timeB = new Date(b?.createdAt || 0).getTime();
            return timeB - timeA;
        });
    }

    return list;
};

const MIN_LOADING_MS = 320;

const collectCategoryIds = (categories, rootId, childId = null) => {
    const tree = buildCategoryTree(categories);
    const root = tree.find((cat) => String(cat.id ?? cat.categoryId) === String(rootId));
    if (!root) return { category: rootId, subcategory: childId, descendantIds: [] };

    const descendantIds = [];
    const walk = (node) => {
        const nodeId = node.id ?? node.categoryId ?? node.name;
        if (nodeId != null) descendantIds.push(String(nodeId));
        (node.children || []).forEach(walk);
    };
    walk(root);

    return {
        category: rootId,
        subcategory: childId,
        descendantIds,
    };
};

export default function useListings(initialParams = {}) {
    const [params, setParams] = useState({ page: 0, size: 10, ...initialParams });
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({ totalPages: 0, totalElements: 0 });
    const [isLoading, setLoading] = useState(false);
    const [isLoadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [categoryMap, setCategoryMap] = useState([]);
    const debouncedQuery = useDebounce(params.q);
    const abortRef = useRef(null);
    // Track which page last fetched to avoid duplicate appends
    const lastFetchedPageRef = useRef(-1);

    useEffect(() => {
        getCategories()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setCategoryMap(Array.isArray(list) ? list : []);
            })
            .catch(() => setCategoryMap([]));
    }, []);

    // Đồng bộ params từ URL khi user đổi category/location/search — reset về page 0
    useEffect(() => {
        setParams((prev) => {
            const next = {
                ...prev,
                page: 0,
                size: Number.isFinite(Number(initialParams?.size)) ? Number(initialParams.size) : prev.size,
                category: initialParams?.category ?? prev.category,
                subcategory: initialParams?.subcategory ?? prev.subcategory,
                location: initialParams?.location ?? prev.location,
                sort: initialParams?.sort ?? prev.sort,
                q: initialParams?.q ?? prev.q,
                condition: initialParams?.condition ?? prev.condition,
                minPrice: initialParams?.minPrice ?? prev.minPrice,
                maxPrice: initialParams?.maxPrice ?? prev.maxPrice,
                prioritizeFollowing: initialParams?.prioritizeFollowing ?? prev.prioritizeFollowing,
                feedType: initialParams?.feedType ?? prev.feedType,
            };
            const same =
                next.size === prev.size && next.category === prev.category && next.subcategory === prev.subcategory &&
                next.location === prev.location && next.sort === prev.sort && next.q === prev.q &&
                next.condition === prev.condition && next.minPrice === prev.minPrice && next.maxPrice === prev.maxPrice &&
                next.prioritizeFollowing === prev.prioritizeFollowing && next.feedType === prev.feedType;
            return same ? prev : next;
        });
    }, [
        initialParams?.category,
        initialParams?.subcategory,
        initialParams?.location,
        initialParams?.sort,
        initialParams?.size,
        initialParams?.q,
        initialParams?.condition,
        initialParams?.minPrice,
        initialParams?.maxPrice,
        initialParams?.prioritizeFollowing,
        initialParams?.feedType,
    ]);

    const fetchData = useCallback(async (currentParams, query, append = false) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const loadingStarted = Date.now();
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const p = normalizeParams(currentParams, query);
            const hasFilters =
                Object.keys(p).some((k) =>
                    ['q', 'category', 'location', 'condition', 'minPrice', 'maxPrice'].includes(k) &&
                    p[k] !== '' &&
                    p[k] != null
                ) || (p.sort && p.sort !== 'createdAt,desc');

            const selectedCategory = p.category != null ? String(p.category) : '';
            const selectedSubcategory = p.subcategory != null ? String(p.subcategory) : '';
            const categoryIds = selectedCategory
                ? collectCategoryIds(categoryMap, selectedCategory, selectedSubcategory).descendantIds
                : [];

            const requestParams = {
                ...(hasFilters
                        ? {
                            q: p.q,
                            categoryId: p.category,
                            subcategoryId: p.subcategory,
                            location: p.location,
                            itemCondition: normalizeConditionParam(p.condition),
                            priceMin: p.minPrice,
                            priceMax: p.maxPrice,
                            sort: p.sort,
                            page: p.page,
                            size: p.size,
                            feedType: p.feedType,
                        }
                        : {
                            ...p,
                            prioritizeFollowing: p.prioritizeFollowing,
                            feedType: p.feedType,
                        }
                ),
                categoryIds: categoryIds.length > 0 ? categoryIds.join(',') : undefined,
            };

            const requestPromise = hasFilters
                ? searchListings(requestParams, { signal: controller.signal })
                : getListings(requestParams, { signal: controller.signal });

            const { data: res } = await requestPromise;
            if (controller.signal.aborted) return;

            const payload = res?.data ?? res;
            const list = Array.isArray(payload?.content)
                ? payload.content
                : Array.isArray(payload)
                    ? payload
                    : [];

            const normalized = list.map(normalizeListing);
            if (append) {
                setData((prev) => applyFeedTypeClientFilter([...prev, ...normalized], p.feedType));
            } else {
                setData(applyFeedTypeClientFilter(normalized, p.feedType));
            }
            lastFetchedPageRef.current = p.page;
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
            setLoadingMore(false);
        }
    }, []);

    // Fetch khi filter thay đổi — replace data, reset page
    useEffect(() => {
        lastFetchedPageRef.current = -1;
        fetchData({ ...params, page: 0 }, debouncedQuery, false);
    }, [
        params.size,
        params.category,
        params.subcategory,
        params.location,
        params.sort,
        params.condition,
        params.minPrice,
        params.maxPrice,
        params.feedType,
        params.prioritizeFollowing,
        debouncedQuery,
        fetchData,
    ]);

    // Fetch khi page tăng — append data (infinite scroll)
    useEffect(() => {
        if (params.page === 0) return;
        if (params.page === lastFetchedPageRef.current) return;
        fetchData(params, debouncedQuery, true);
    }, [params.page, fetchData, debouncedQuery, params]);

    const refetch = useCallback(() => {
        lastFetchedPageRef.current = -1;
        fetchData({ ...params, page: 0 }, debouncedQuery, false);
    }, [fetchData, params, debouncedQuery]);

    const hasMore = meta.totalPages > 0 && params.page < meta.totalPages - 1;

    /** Load thêm trang tiếp theo (infinite scroll). */
    const loadMore = useCallback(() => {
        if (isLoadingMore || isLoading || !hasMore) return;
        setParams((p) => ({ ...p, page: p.page + 1 }));
    }, [isLoadingMore, isLoading, hasMore]);

    /** Cập nhật một tin trong feed (vd. sau like); removeFromList / removeSellerId — sau chặn người bán. */
    const patchListing = useCallback((listingId, patch) => {
        if (!patch || typeof patch !== 'object') return;
        if (patch.removeSellerId != null) {
            const sid = String(patch.removeSellerId);
            setData((prev) =>
                prev.filter((item) => {
                    const itemSid = getSellerIdFromListingItem(item);
                    return itemSid == null || String(itemSid) !== sid;
                }),
            );
            return;
        }
        if (listingId == null) return;
        if (patch.removeFromList === true) {
            setData((prev) =>
                prev.filter((item) => {
                    const lid = item?.id ?? item?.listingId ?? item?.listing_id;
                    return lid == null || String(lid) !== String(listingId);
                }),
            );
            return;
        }
        setData((prev) =>
            prev.map((item) => {
                const lid = item?.id ?? item?.listingId ?? item?.listing_id;
                if (lid == null || String(lid) !== String(listingId)) return item;
                return { ...item, ...patch };
            }),
        );
    }, []);

    return { data, meta, isLoading, isLoadingMore, hasMore, error, refetch, loadMore, params, setParams, patchListing };
}