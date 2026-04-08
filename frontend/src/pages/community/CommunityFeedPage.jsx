/**
 * Trang Cộng đồng — feed: GET /api/community/posts (bài ACTIVE, chưa xóa/ẩn).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    Typography,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import TagOutlinedIcon from '@mui/icons-material/TagOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RightPanel from '../../components/layout/RightPanel';
import { useAuth } from '../../hooks/useAuth';
import CommunityPostCard from '../../components/community/CommunityPostCard';
import { getCommunityPosts } from '../../api/communityApi';
import { unwrapApiData } from '../../utils/apiPayload';
import useCommunityFeedRealtime from '../../hooks/useCommunityFeedRealtime';

/** Nhãn hiển thị + slug hashtag (chữ thường, không dấu cách — khớp normalize backend). */
const PLACEHOLDER_TAGS = [
    { label: 'Hỏi đáp', tag: 'hoidap' },
    { label: 'Ký túc xá', tag: 'kytucxa' },
    { label: 'Học bổng', tag: 'hocbong' },
    { label: 'Đồ cũ', tag: 'docu' },
    { label: 'Sự kiện', tag: 'sukien' },
];
const PAGE_SIZE = 15;

function normalizeCursor(res) {
    const raw = unwrapApiData(res);
    const items = Array.isArray(raw?.items) ? raw.items : [];
    return {
        items,
        nextCursor: raw?.nextCursor ?? null,
        hasMore: Boolean(raw?.hasMore),
    };
}

function FeedSkeleton() {
    return (
        <Stack spacing={2}>
            {[1, 2, 3].map((k) => (
                <Skeleton key={k} variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            ))}
        </Stack>
    );
}

export default function CommunityFeedPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const isDark = theme.palette.mode === 'dark';

    const hashtagFilter = useMemo(() => (searchParams.get('hashtag') || '').trim(), [searchParams]);
    const sortFeed = useMemo(() => (searchParams.get('sort') === 'top' ? 'top' : 'latest'), [searchParams]);

    const [posts, setPosts] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef(null);
    const loadMoreLockRef = useRef(false);
    const sentinelRef = useRef(null);
    const restoreScrollRef = useRef(false);

    const goCreatePost = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/community/new' } });
            return;
        }
        navigate('/community/new');
    };

    const fetchPage = useCallback(
        async (nextCursor, append) => {
            abortRef.current?.abort();
            const ac = new AbortController();
            abortRef.current = ac;
            try {
                const params = { limit: PAGE_SIZE, sort: sortFeed };
                if (nextCursor) params.cursor = nextCursor;
                if (hashtagFilter) params.hashtag = hashtagFilter;
                const res = await getCommunityPosts(params, { signal: ac.signal });
                const { items, nextCursor: nc, hasMore: hm } = normalizeCursor(res);
                setError('');
                setPosts((prev) => (append ? [...prev, ...items] : items));
                setCursor(nc);
                setHasMore(hm);
            } catch (e) {
                if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
                setError(
                    e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    e?.message ||
                    'Không tải được bài cộng đồng.',
                );
                if (!append) setPosts([]);
            }
        },
        [hashtagFilter, sortFeed],
    );

    const loadInitial = useCallback(async () => {
        setLoading(true);
        setCursor(null);
        setHasMore(true);
        await fetchPage(null, false);
        setLoading(false);
    }, [fetchPage]);

    useEffect(() => {
        loadInitial();
        return () => abortRef.current?.abort();
    }, [loadInitial]);

    // Restore/save scroll position for better UX when back from detail
    useEffect(() => {
        restoreScrollRef.current = true;
    }, [hashtagFilter, sortFeed]);

    useEffect(() => {
        if (!restoreScrollRef.current) return;
        if (loading) return;
        restoreScrollRef.current = false;
        try {
            const key = `community.scroll.${sortFeed}.${hashtagFilter || 'all'}`;
            const raw = sessionStorage.getItem(key);
            const y = raw ? Number(raw) : 0;
            if (!Number.isNaN(y) && y > 0) {
                window.scrollTo({ top: y, behavior: 'instant' });
            }
        } catch {
            // ignore
        }
    }, [loading, hashtagFilter, sortFeed]);

    useEffect(() => {
        const onScroll = () => {
            try {
                const key = `community.scroll.${sortFeed}.${hashtagFilter || 'all'}`;
                sessionStorage.setItem(key, String(window.scrollY || 0));
            } catch {
                // ignore
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [hashtagFilter, sortFeed]);

    const loadMore = useCallback(async () => {
        if (loadMoreLockRef.current || !hasMore || !cursor) return;
        loadMoreLockRef.current = true;
        setLoadingMore(true);
        try {
            await fetchPage(cursor, true);
        } finally {
            setLoadingMore(false);
            loadMoreLockRef.current = false;
        }
    }, [fetchPage, cursor, hasMore]);

    const openPost = useCallback((postId) => navigate(`/community/posts/${postId}`), [navigate]);

    const handlePatchPost = useCallback((postId, patch) => {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
    }, []);

    const handleRealtimeStats = useCallback(
        ({ postId, likeCount, commentCount }) => {
            setPosts((prev) =>
                prev.map((p) =>
                    Number(p.id) === Number(postId)
                        ? {
                            ...p,
                            likeCount,
                            commentCount,
                        }
                        : p,
                ),
            );
        },
        [],
    );

    useCommunityFeedRealtime(true, handleRealtimeStats);

    // Infinite scroll trigger (IntersectionObserver)
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        if (loading || loadingMore) return;
        if (!hasMore) return;

        const obs = new IntersectionObserver(
            (entries) => {
                const e = entries?.[0];
                if (!e?.isIntersecting) return;
                if (!hasMore || loadingMore || loading) return;
                void loadMore();
            },
            { root: null, rootMargin: '600px', threshold: 0 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasMore, loading, loadingMore, loadMore]);

    const setSortTab = (_e, value) => {
        const next = new URLSearchParams(searchParams);
        if (value === 'top') next.set('sort', 'top');
        else next.delete('sort');
        next.delete('page');
        setSearchParams(next, { replace: true });
    };

    const openHashtagFilter = (tag) => {
        const next = new URLSearchParams(searchParams);
        next.set('hashtag', tag);
        next.delete('page');
        setSearchParams(next, { replace: true });
    };

    const clearHashtagFilter = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('hashtag');
        next.delete('page');
        setSearchParams(next, { replace: true });
    };

    return (
        <Box
            sx={{
                display: 'flex',
                gap: { xs: 2, lg: 3 },
                p: 2,
                alignItems: 'flex-start',
                maxWidth: 1040,
                mx: 'auto',
                width: '100%',
                justifyContent: 'center',
            }}
        >
            <Box sx={{ flex: 1, minWidth: { xs: 0, sm: 400 }, maxWidth: 680 }}>
                <Box
                    sx={{
                        borderRadius: 3,
                        p: { xs: 2.5, sm: 3 },
                        mb: 2.5,
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(59,130,246,0.12) 50%, transparent 100%)'
                            : alpha(theme.palette.primary.main, 0.08),
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : alpha(theme.palette.primary.main, 0.2),
                    }}
                >
                    <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 1.5 }}>
                        <ForumOutlinedIcon sx={{ fontSize: 32, color: 'primary.light' }} />
                        <Typography variant="h5" fontWeight={800} sx={{ color: '#9D6EED' }}>
                            Cộng đồng SLife
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                        Nơi sinh viên Hòa Lạc chia sẻ, hỏi đáp và bàn luận — tách biệt với{' '}
                        <strong>Feed mua bán</strong>. Chỉ hiển thị bài đang hoạt động (ACTIVE), chưa bị gỡ hoặc ẩn. Ấn
                        hashtag trong nội dung bài để lọc theo chủ đề.
                    </Typography>
                    {hashtagFilter ? (
                        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                            <Chip
                                size="small"
                                color="primary"
                                label={`#${hashtagFilter}`}
                                onDelete={clearHashtagFilter}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Đang lọc theo hashtag — xóa chip để xem toàn bộ feed.
                            </Typography>
                        </Stack>
                    ) : null}
                    <Tabs
                        value={sortFeed}
                        onChange={setSortTab}
                        sx={{ mb: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.5, fontWeight: 700 } }}
                    >
                        <Tab label="Mới nhất" value="latest" />
                        <Tab label="Phổ biến" value="top" />
                    </Tabs>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                        {PLACEHOLDER_TAGS.map(({ label, tag }) => (
                            <Chip
                                key={tag}
                                size="small"
                                icon={<TagOutlinedIcon sx={{ fontSize: '16px !important' }} />}
                                label={label}
                                variant="outlined"
                                onClick={() => openHashtagFilter(tag)}
                                sx={{
                                    borderColor: alpha(theme.palette.primary.main, 0.45),
                                    color: 'text.secondary',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                        <Button
                            variant="contained"
                            startIcon={<PostAddOutlinedIcon />}
                            onClick={goCreatePost}
                            sx={{ fontWeight: 700 }}
                        >
                            Tạo bài đăng
                        </Button>
                        <Button variant="outlined" onClick={() => navigate('/feed')} sx={{ fontWeight: 700 }}>
                            Về Feed mua bán
                        </Button>
                        <Button
                            variant="text"
                            startIcon={<RefreshOutlinedIcon />}
                            onClick={loadInitial}
                            disabled={loading}
                            sx={{ fontWeight: 700 }}
                        >
                            Làm mới
                        </Button>
                    </Stack>
                </Box>

                {error ? (
                    <Alert
                        severity="error"
                        sx={{ mb: 2, borderRadius: 2 }}
                        action={
                            <Button color="inherit" size="small" onClick={loadInitial}>
                                Thử lại
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                ) : null}

                {loading ? (
                    <FeedSkeleton />
                ) : posts.length === 0 ? (
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            bgcolor: isDark ? alpha('#fff', 0.04) : alpha(theme.palette.primary.main, 0.04),
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider',
                        }}
                    >
                        <CardContent sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ color: '#9D6EED' }}>
                                Chưa có bài đăng cộng đồng
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>
                                Hãy là người đầu tiên chia sẻ — hoặc kiểm tra kết nối API nếu bạn chắc đã có bài trên
                                server.
                            </Typography>
                            <Button variant="text" onClick={goCreatePost} sx={{ fontWeight: 700 }}>
                                Tạo bài đăng ngay
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Stack spacing={2}>
                        {posts.map((post) => (
                            <CommunityPostCard
                                key={post.id}
                                post={post}
                                onOpen={openPost}
                                onPatchPost={handlePatchPost}
                            />
                        ))}
                        {/* Sentinel for infinite scroll */}
                        <Box ref={sentinelRef} sx={{ height: 1 }} />

                        {/* Loading more indicator + fallback button */}
                        {hasMore ? (
                            <Box sx={{ textAlign: 'center', pt: 1 }}>
                                {loadingMore ? (
                                    <CircularProgress size={22} />
                                ) : (
                                    <Button
                                        variant="outlined"
                                        onClick={loadMore}
                                        sx={{ fontWeight: 700, minWidth: 160 }}
                                    >
                                        Xem thêm
                                    </Button>
                                )}
                            </Box>
                        ) : null}
                    </Stack>
                )}
            </Box>

            <RightPanel />
        </Box>
    );
}
