/**
 * Trang Cộng đồng — feed: GET /api/community/posts (bài ACTIVE, chưa xóa/ẩn).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { useNavigate, useSearchParams } from 'react-router-dom';
import RightPanel from '../../components/layout/RightPanel';
import { useAuth } from '../../hooks/useAuth';
import CommunityPostCard from '../../components/community/CommunityPostCard';
import { createCommunityPostWithImages, getCommunityPosts } from '../../api/communityApi';
import { unwrapApiData } from '../../utils/apiPayload';
import useCommunityFeedRealtime from '../../hooks/useCommunityFeedRealtime';
import { fullImageUrl } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';
import { useMaxCommunityPostImages } from '../../hooks/useMaxCommunityPostImages';
import { COMMUNITY_POST_MAX_DESCRIPTION, COMMUNITY_POST_MAX_IMAGE_MB } from '../../utils/communityPostLimits';
import { validateCommunityPostImages } from '../../utils/communityImageValidation';

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
        <Stack spacing={0}>
            {[1, 2, 3].map((k) => (
                <Skeleton key={k} variant="rounded" height={136} sx={{ borderRadius: 0, bgcolor: 'rgba(255,255,255,0.05)', mb: 0.6 }} />
            ))}
        </Stack>
    );
}

export default function CommunityFeedPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated, user } = useAuth();
    const { showToast } = useToast();
    const maxImages = useMaxCommunityPostImages();
    const isDark = theme.palette.mode === 'dark';

    const hashtagFilter = useMemo(() => (searchParams.get('hashtag') || '').trim(), [searchParams]);
    const sortFeed = useMemo(() => (searchParams.get('sort') === 'top' ? 'top' : 'latest'), [searchParams]);

    const [posts, setPosts] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [composerText, setComposerText] = useState('');
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerDesc, setComposerDesc] = useState('');
    const [composerImages, setComposerImages] = useState([]);
    const [composerSubmitting, setComposerSubmitting] = useState(false);
    const [composerError, setComposerError] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef(null);
    const loadMoreLockRef = useRef(false);
    const sentinelRef = useRef(null);
    const restoreScrollRef = useRef(false);
    const imageInputRef = useRef(null);
    const previewStripRef = useRef(null);
    const previewDragRef = useRef({ isDown: false, startX: 0, startLeft: 0 });

    const goCreatePost = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/community/new' } });
            return;
        }
        const trimmed = composerText.trim();
        setComposerDesc(trimmed);
        setComposerImages([]);
        setComposerError('');
        setComposerOpen(true);
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
                setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Không tải được bài cộng đồng.');
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

    useEffect(() => {
        restoreScrollRef.current = true;
    }, [hashtagFilter, sortFeed]);

    useEffect(() => {
        if (!restoreScrollRef.current || loading) return;
        restoreScrollRef.current = false;
        try {
            const key = `community.scroll.${sortFeed}.${hashtagFilter || 'all'}`;
            const raw = sessionStorage.getItem(key);
            const y = raw ? Number(raw) : 0;
            if (!Number.isNaN(y) && y > 0) window.scrollTo({ top: y, behavior: 'instant' });
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

    const handleRealtimeStats = useCallback(({ postId, likeCount, commentCount }) => {
        setPosts((prev) => prev.map((p) => (Number(p.id) === Number(postId) ? { ...p, likeCount, commentCount } : p)));
    }, []);

    useCommunityFeedRealtime(true, handleRealtimeStats);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || loading || loadingMore || !hasMore) return;
        const obs = new IntersectionObserver(
            (entries) => {
                const e = entries?.[0];
                if (!e?.isIntersecting || !hasMore || loadingMore || loading) return;
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

    const handleCloseComposer = () => {
        setComposerOpen(false);
        setComposerError('');
        try {
            document.activeElement?.blur?.();
        } catch {
            // ignore
        }
    };

    const openImagePicker = () => {
        imageInputRef.current?.click();
    };

    const handlePickComposerImages = (e) => {
        const picked = Array.from(e.target.files || []);
        if (!picked.length) return;
        const merged = [...composerImages, ...picked].slice(0, maxImages);
        const imgCheck = validateCommunityPostImages(merged, maxImages, COMMUNITY_POST_MAX_IMAGE_MB);
        if (!imgCheck.ok) {
            setComposerError(imgCheck.message);
            showToast(imgCheck.message, 'error');
            e.target.value = '';
            return;
        }
        setComposerError('');
        setComposerImages(merged);
        e.target.value = '';
    };

    const removeComposerImageAt = (index) => {
        setComposerImages((prev) => prev.filter((_, i) => i !== index));
    };

    const onPreviewPointerDown = (e) => {
        const el = previewStripRef.current;
        if (!el) return;
        previewDragRef.current = {
            isDown: true,
            startX: e.clientX,
            startLeft: el.scrollLeft,
        };
        el.setPointerCapture?.(e.pointerId);
    };

    const onPreviewPointerMove = (e) => {
        const el = previewStripRef.current;
        const st = previewDragRef.current;
        if (!el || !st.isDown) return;
        const dx = e.clientX - st.startX;
        el.scrollLeft = st.startLeft - dx;
    };

    const endPreviewDrag = () => {
        previewDragRef.current.isDown = false;
    };

    const handleCreatePostInline = async () => {
        if (!isAuthenticated || composerSubmitting) return;
        const description = composerDesc.trim();
        if (!description && composerImages.length === 0) {
            setComposerError('Hãy nhập nội dung hoặc thêm ít nhất 1 ảnh.');
            return;
        }

        const imgCheck = validateCommunityPostImages(composerImages, maxImages, COMMUNITY_POST_MAX_IMAGE_MB);
        if (!imgCheck.ok) {
            setComposerError(imgCheck.message);
            showToast(imgCheck.message, 'error');
            return;
        }

        setComposerSubmitting(true);
        setComposerError('');
        try {
            const normalizedTitleSeed = (description || '')
                .replace(/\s+/g, ' ')
                .trim();
            const autoTitle = (normalizedTitleSeed || 'Bài viết cộng đồng').slice(0, 50).trim();
            const payload = {
                title: autoTitle || 'Bài viết cộng đồng',
                description: description || null,
                hashtags: [],
            };
            const res = await createCommunityPostWithImages(payload, composerImages);
            const created = unwrapApiData(res);
            if (created && typeof created === 'object') setPosts((prev) => [created, ...prev]);
            setComposerOpen(false);
            setComposerDesc('');
            setComposerImages([]);
            setComposerText('');
            try {
                document.activeElement?.blur?.();
            } catch {
                // ignore
            }
            showToast('Đã đăng bài cộng đồng!', 'success');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Đăng bài thất bại. Thử lại sau.';
            setComposerError(typeof msg === 'string' ? msg : 'Đăng bài thất bại.');
            showToast(typeof msg === 'string' ? msg : 'Đăng bài thất bại.', 'error');
        } finally {
            setComposerSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 96px)',
                borderRadius: { xs: 0, md: 5 },
                p: { xs: 1, sm: 1.5, md: 2 },
                background: isDark
                    ? 'radial-gradient(circle at 20% 0%, rgba(92,61,168,0.2) 0%, rgba(13,16,44,0.95) 46%, #080d2a 100%)'
                    : alpha(theme.palette.primary.main, 0.04),
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
            }}
        >
            <Box sx={{ display: 'flex', gap: { xs: 1.5, lg: 2.5 }, alignItems: 'flex-start', maxWidth: 1220, mx: 'auto', width: '100%', justifyContent: 'center' }}>
                <Box sx={{ flex: 1, minWidth: { xs: 0, sm: 420 }, maxWidth: 720 }}>
                    <Box
                        sx={{
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            bgcolor: 'rgba(9,12,27,0.88)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderBottom: 'none',
                            overflow: 'hidden',
                            mb: 0,
                        }}
                    >
                        <Tabs
                            value={sortFeed}
                            onChange={setSortTab}
                            centered
                            sx={{
                                minHeight: 40,
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                '& .MuiTab-root': { minHeight: 40, py: 0.2, fontWeight: 700, color: 'rgba(255,255,255,0.55)' },
                                '& .Mui-selected': { color: '#d8cdff !important' },
                                '& .MuiTabs-indicator': { bgcolor: '#9D6EED', height: 2.5 },
                            }}
                        >
                            <Tab label="Dành cho bạn" value="latest" />
                            <Tab label="Đang theo dõi" value="top" />
                        </Tabs>

                        <Box sx={{ px: 1.25, py: 1.1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar
                                    src={fullImageUrl(user?.avatarUrl || user?.avatar || user?.profilePicture || user?.imageUrl || '')}
                                    alt={user?.fullName || user?.username || 'Bạn'}
                                    sx={{ width: 34, height: 34, bgcolor: '#90caf9', color: '#112' }}
                                >
                                    {(user?.fullName || user?.username || 'B').slice(0, 1).toUpperCase()}
                                </Avatar>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={composerText}
                                    onClick={goCreatePost}
                                    placeholder="Có gì mới?"
                                    inputProps={{ readOnly: true }}
                                    autoComplete="off"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: 40,
                                            borderRadius: '999px',
                                            bgcolor: 'rgba(255,255,255,0.04)',
                                            cursor: 'pointer',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.16)' },
                                            '&:hover fieldset': { borderColor: 'rgba(183,167,255,0.45)' },
                                        },
                                        '& .MuiInputBase-input': { color: '#fff', fontSize: 14, px: 1.6, cursor: 'pointer' },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={goCreatePost}
                                    sx={{ borderRadius: 12, px: 1.8, minWidth: 74, fontWeight: 700, bgcolor: 'rgba(157,110,237,0.95)', '&:hover': { bgcolor: '#ad88ff' } }}
                                >
                                    Đăng
                                </Button>
                            </Stack>
                        </Box>
                    </Box>

                    {error ? (
                        <Alert severity="error" sx={{ mb: 1.2, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={loadInitial}>Thử lại</Button>}>
                            {error}
                        </Alert>
                    ) : null}

                    <Box
                        sx={{
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            borderBottomLeftRadius: '24px',
                            borderBottomRightRadius: '24px',
                            bgcolor: 'rgba(9,12,27,0.88)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderTop: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        {loading ? (
                            <FeedSkeleton />
                        ) : posts.length === 0 ? (
                            <Card elevation={0} sx={{ borderRadius: 0, bgcolor: 'transparent', border: 'none' }}>
                                <CardContent sx={{ py: 5, textAlign: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ color: '#d5ccff' }}>
                                        Chưa có bài đăng cộng đồng
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>
                                        Hãy là người đầu tiên chia sẻ với cộng đồng sinh viên Hòa Lạc.
                                    </Typography>
                                    <Button variant="text" onClick={goCreatePost} sx={{ fontWeight: 700 }}>
                                        Tạo bài đăng ngay
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Stack spacing={0}>
                                {posts.map((post) => (
                                    <CommunityPostCard key={post.id} post={post} onOpen={openPost} onPatchPost={handlePatchPost} />
                                ))}

                                <Box ref={sentinelRef} sx={{ height: 1 }} />

                                {hasMore ? (
                                    <Box sx={{ textAlign: 'center', py: 1.2 }}>
                                        {loadingMore ? (
                                            <CircularProgress size={22} />
                                        ) : (
                                            <Button variant="outlined" onClick={loadMore} sx={{ fontWeight: 700, minWidth: 160 }}>
                                                Xem thêm
                                            </Button>
                                        )}
                                    </Box>
                                ) : null}
                            </Stack>
                        )}
                    </Box>
                </Box>

                <RightPanel />
            </Box>

            <Dialog
                open={composerOpen}
                onClose={handleCloseComposer}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        bgcolor: '#10121a',
                        color: '#fff',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.08)',
                        width: { xs: '96vw', sm: '92vw', md: '860px' },
                        maxWidth: '860px',
                        ...(composerImages.length > 0 ? { minHeight: { xs: '78vh', sm: '82vh' } } : {}),
                        maxHeight: '92vh',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, py: 1.25, px: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
                        <IconButton
                            onClick={handleCloseComposer}
                            size="small"
                            sx={{ color: '#fff', zIndex: 2, pointerEvents: 'auto' }}
                            aria-label="Đóng"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>Bài viết mới</Typography>
                        <Box sx={{ width: 32 }} />
                    </Box>
                </DialogTitle>

                <DialogContent
                    sx={{
                        pt: 4,
                        pb: 1,
                        px: 2,
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(172,146,255,0.55) rgba(255,255,255,0.08)',
                        '&::-webkit-scrollbar': { width: 10 },
                        '&::-webkit-scrollbar-track': {
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 999,
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'linear-gradient(180deg, rgba(180,153,255,0.85), rgba(126,94,230,0.9))',
                            borderRadius: 999,
                            border: '2px solid rgba(255,255,255,0.06)',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: 'linear-gradient(180deg, rgba(199,176,255,0.95), rgba(142,111,241,0.95))',
                        },
                    }}
                >
                    <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ mt: 1.5 }}>
                        <Avatar
                            src={fullImageUrl(user?.avatarUrl || user?.avatar || user?.profilePicture || user?.imageUrl || '')}
                            alt={user?.fullName || user?.username || 'Bạn'}
                            sx={{ width: 38, height: 38, mt: 0.2 }}
                        >
                            {(user?.fullName || user?.username || 'B').slice(0, 1).toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={0.8}>
                                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{user?.username || user?.fullName || 'Bạn'}</Typography>
                            </Stack>

                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                value={composerDesc}
                                onChange={(e) => setComposerDesc(e.target.value)}

                                placeholder="Có gì mới?"
                                variant="standard"
                                sx={{
                                    mt: 1,
                                    '& .MuiInputBase-root': { color: '#fff' },
                                    '& .MuiInputBase-input': { color: '#fff', fontSize: 16, lineHeight: 1.45 },
                                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.48)', opacity: 1 },
                                    '& .MuiInput-underline:before, & .MuiInput-underline:after': { display: 'none' },
                                }}
                            />

                            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                                <IconButton
                                    size="small"
                                    sx={{ color: 'rgba(255,255,255,0.72)' }}
                                    onClick={openImagePicker}
                                    aria-label="Thêm ảnh"
                                >
                                    <AddPhotoAlternateOutlinedIcon fontSize="small" />
                                </IconButton>
                                <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.52)' }}>Thêm ảnh</Typography>
                            </Stack>

                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handlePickComposerImages}
                            />

                            {composerImages.length > 0 ? (
                                <Box
                                    ref={previewStripRef}
                                    onPointerDown={onPreviewPointerDown}
                                    onPointerMove={onPreviewPointerMove}
                                    onPointerUp={endPreviewDrag}
                                    onPointerCancel={endPreviewDrag}
                                    onPointerLeave={endPreviewDrag}
                                    sx={{
                                        mt: 1,
                                        display: 'flex',
                                        gap: 1,
                                        overflowX: 'auto',
                                        overflowY: 'hidden',
                                        pb: 0.5,
                                        pr: 0.25,
                                        cursor: 'grab',
                                        userSelect: 'none',
                                        touchAction: 'pan-y',
                                        scrollBehavior: 'auto',
                                        WebkitOverflowScrolling: 'touch',
                                        scrollbarWidth: 'none',
                                        '&::-webkit-scrollbar': { display: 'none' },
                                        '&:active': { cursor: 'grabbing' },
                                    }}
                                >
                                    {composerImages.map((file, idx) => {
                                        const previewUrl = URL.createObjectURL(file);
                                        return (
                                            <Box
                                                key={`${file.name}-${idx}`}
                                                sx={{
                                                    position: 'relative',
                                                    flex: { xs: '0 0 240px', sm: '0 0 320px' },
                                                    borderRadius: 1.5,
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255,255,255,0.14)',
                                                    bgcolor: 'rgba(255,255,255,0.04)',
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={previewUrl}
                                                    alt={file.name || `image-${idx + 1}`}
                                                    draggable={false}
                                                    onLoad={() => URL.revokeObjectURL(previewUrl)}
                                                    sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeComposerImageAt(idx)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        bgcolor: 'rgba(0,0,0,0.55)',
                                                        color: '#fff',
                                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
                                                    }}
                                                    aria-label="Xóa ảnh"
                                                >
                                                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : null}
                        </Box>
                    </Stack>

                    {composerError ? (
                        <Alert severity="error" sx={{ borderRadius: 2, mt: 1.25 }}>
                            {composerError}
                        </Alert>
                    ) : null}
                </DialogContent>

                <DialogActions sx={{ px: 2, py: 1.25, borderTop: '1px solid rgba(255,255,255,0.08)', justifyContent: 'flex-end' }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        {composerDesc.length > COMMUNITY_POST_MAX_DESCRIPTION ? (
                            <Typography sx={{ color: 'rgba(255,80,80,0.95)', fontWeight: 700, fontSize: 14 }}>
                                -{composerDesc.length - COMMUNITY_POST_MAX_DESCRIPTION}
                            </Typography>
                        ) : null}
                        <Button
                            variant="contained"
                            onClick={handleCreatePostInline}
                            disabled={composerSubmitting || (!composerDesc.trim() && composerImages.length === 0) || composerDesc.length > COMMUNITY_POST_MAX_DESCRIPTION}
                            sx={{
                                fontWeight: 700,
                                borderRadius: 2,
                                px: 2.25,
                                minWidth: 92,
                                bgcolor: 'rgba(255,255,255,0.08)',
                                color: '#fff',
                                boxShadow: 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', boxShadow: 'none' },
                                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' },
                            }}
                        >
                            {composerSubmitting ? 'Đang đăng…' : 'Đăng'}
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
