import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unwrapApiData } from '../utils/apiPayload';
import { getCommunityPosts, getSavedCommunityPosts, getLikedCommunityPosts, getMyCommunityPosts } from '../api/communityApi';

const PAGE_SIZE = 15;

function normalizeCursorResponse(res) {
    const raw = unwrapApiData(res);
    const items = Array.isArray(raw?.items) ? raw.items : [];
    return {
        items,
        nextCursor: raw?.nextCursor ?? null,
        hasMore: Boolean(raw?.hasMore),
    };
}

function normalizePagedResponse(res) {
    const raw = unwrapApiData(res);
    return {
        items: Array.isArray(raw?.content) ? raw.content : [],
        nextCursor: raw?.last ? null : String((raw?.number ?? 0) + 1),
        hasMore: !raw?.last,
    };
}

export default function useCommunityPostList({
                                                 mode = 'feed',
                                                 hashtag = '',
                                                 sort = 'latest',
                                             } = {}) {
    const [posts, setPosts] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef(null);
    const loadMoreLockRef = useRef(false);
    const loadMoreCooldownRef = useRef(0);

    const fetchPage = useCallback(async (nextCursor, append) => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        try {
            const params = { limit: PAGE_SIZE, sort };
            if (nextCursor) params.cursor = nextCursor;
            if (hashtag) params.hashtag = hashtag;

            const res = mode === 'saved'
                ? await getSavedCommunityPosts({ page: nextCursor ? Number(nextCursor) : 0, size: PAGE_SIZE }, { signal: ac.signal })
                : mode === 'liked'
                    ? await getLikedCommunityPosts({ page: nextCursor ? Number(nextCursor) : 0, size: PAGE_SIZE }, { signal: ac.signal })
                    : mode === 'mine'
                        ? await getMyCommunityPosts({ page: nextCursor ? Number(nextCursor) : 0, size: PAGE_SIZE }, { signal: ac.signal })
                        : await getCommunityPosts(params, { signal: ac.signal });

            const normalized = mode === 'feed' ? normalizeCursorResponse(res) : normalizePagedResponse(res);
            const { items, nextCursor: nc, hasMore: hm } = normalized;
            setError('');
            setPosts((prev) => (append ? [...prev, ...items] : items));
            setCursor(nc);
            setHasMore(hm);
        } catch (e) {
            if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
            setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Không tải được bài cộng đồng.');
            if (!append) setPosts([]);
        }
    }, [hashtag, mode, sort]);

    const loadInitial = useCallback(async () => {
        setLoading(true);
        setCursor(null);
        setHasMore(false);
        try {
            await fetchPage(null, false);
        } finally {
            setLoading(false);
        }
    }, [fetchPage]);

    useEffect(() => {
        loadInitial();
        return () => abortRef.current?.abort();
    }, [loadInitial]);

    const loadMore = useCallback(async () => {
        if (loadMoreLockRef.current || !hasMore || !cursor) return;
        const now = Date.now();
        if (now - loadMoreCooldownRef.current < 700) return;
        loadMoreCooldownRef.current = now;

        loadMoreLockRef.current = true;
        setLoadingMore(true);
        try {
            await fetchPage(cursor, true);
        } finally {
            setLoadingMore(false);
            window.setTimeout(() => {
                loadMoreLockRef.current = false;
            }, 120);
        }
    }, [fetchPage, cursor, hasMore]);

    const patchPost = useCallback((postId, patch) => {
        setPosts((prev) => prev.map((p) => (Number(p.id) === Number(postId) ? { ...p, ...patch } : p)));
    }, []);

    const deletePost = useCallback((postId) => {
        setPosts((prev) => prev.filter((p) => Number(p.id) !== Number(postId)));
    }, []);

    return useMemo(() => ({
        posts,
        setPosts,
        cursor,
        hasMore,
        loading,
        loadingMore,
        error,
        loadInitial,
        loadMore,
        patchPost,
        deletePost,
    }), [posts, cursor, hasMore, loading, loadingMore, error, loadInitial, loadMore, patchPost, deletePost]);
}
