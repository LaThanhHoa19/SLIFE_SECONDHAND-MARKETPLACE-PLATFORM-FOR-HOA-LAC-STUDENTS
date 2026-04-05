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

function normalizePaged(res) {
    const raw = unwrapApiData(res);
    const content = Array.isArray(raw?.content) ? raw.content : [];
    const page = Number(raw?.page);
    const totalPages = Number(raw?.totalPages);
    const totalElements = Number(raw?.totalElements);
    return {
        content,
        page: Number.isFinite(page) ? page : 0,
        totalPages: Number.isFinite(totalPages) ? totalPages : 0,
        totalElements: Number.isFinite(totalElements) ? totalElements : content.length,
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
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef(null);
    const loadMoreLockRef = useRef(false);

    const goCreatePost = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/community/new' } });
            return;
        }
        navigate('/community/new');
    };

    const fetchPage = useCallback(
        async (pageIndex, append) => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        try {
            const params = { page: pageIndex, size: PAGE_SIZE, sort: sortFeed };
            if (hashtagFilter) params.hashtag = hashtagFilter;
            const res = await getCommunityPosts(params, { signal: ac.signal });
            const { content, page: p, totalPages: tp } = normalizePaged(res);
            setError('');
            setPosts((prev) => (append ? [...prev, ...content] : content));
            setPage(p);
            setTotalPages(tp);
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
        await fetchPage(0, false);
        setLoading(false);
    }, [fetchPage]);

    useEffect(() => {
        loadInitial();
        return () => abortRef.current?.abort();
    }, [loadInitial]);

    const loadMore = useCallback(async () => {
        if (loadMoreLockRef.current || page + 1 >= totalPages) return;
        loadMoreLockRef.current = true;
        setLoadingMore(true);
        try {
            await fetchPage(page + 1, true);
        } finally {
            setLoadingMore(false);
            loadMoreLockRef.current = false;
        }
    }, [fetchPage, page, totalPages]);

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

    const hasMore = totalPages > 0 && page + 1 < totalPages;

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
                        <Typography variant="h5" fontWeight={800} sx={{ fontFamily: "'Outfit', sans-serif" }}>
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
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
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
                        {hasMore ? (
                            <Box sx={{ textAlign: 'center', pt: 1 }}>
                                <Button
                                    variant="outlined"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    sx={{ fontWeight: 700, minWidth: 160 }}
                                >
                                    {loadingMore ? <CircularProgress size={22} /> : 'Xem thêm'}
                                </Button>
                            </Box>
                        ) : null}
                    </Stack>
                )}
            </Box>

            <RightPanel />
        </Box>
    );
}
