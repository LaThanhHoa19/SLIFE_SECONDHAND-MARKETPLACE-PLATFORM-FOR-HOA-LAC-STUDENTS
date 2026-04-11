/**
 * SCRUM-172: Trang danh sách thông báo đầy đủ.
 */
import { Box, Button, CircularProgress, IconButton, InputAdornment, Skeleton, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { DoneAll as DoneAllIcon, NotificationsOff as EmptyIcon } from '@mui/icons-material';
import { NotificationContext } from '../../providers/NotificationProvider';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { getNotificationsPage, searchNotificationsPage, markNotificationRead } from '../../api/notificationApi';

const formatNotificationTime = (createdAt) => {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return d.toLocaleDateString('vi-VN');
};

export default function NotificationsPage() {
    const { unreadCount, markAllRead } = useContext(NotificationContext);
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const restoreScrollRef = useRef(false);
    const sentinelRef = useRef(null);

    const isSearching = debouncedQ.trim().length > 0;
    const pageSize = 7;

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 350);
        return () => clearTimeout(t);
    }, [q]);

    const fetchPage = async ({ nextCursor, reset } = {}) => {
        if (loading) return;
        setLoading(true);
        try {
            const resp = isSearching
                ? await searchNotificationsPage({ q: debouncedQ.trim(), limit: pageSize, cursor: nextCursor || undefined })
                : await getNotificationsPage({ limit: pageSize, cursor: nextCursor || undefined });
            const page = resp?.data?.data ?? resp?.data;
            const newItems = Array.isArray(page?.items) ? page.items : [];
            setItems((prev) => (reset ? newItems : [...(Array.isArray(prev) ? prev : []), ...newItems]));
            setCursor(page?.nextCursor ?? null);
            setHasMore(Boolean(page?.hasMore));
        } catch (e) {
            console.error('Failed to load notifications page:', e);
            if (reset) {
                setItems([]);
                setCursor(null);
                setHasMore(false);
            }
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    // Load first page (and reset when search changes)
    useEffect(() => {
        setInitialLoading(true);
        setItems([]);
        setCursor(null);
        setHasMore(true);
        restoreScrollRef.current = true;
        void fetchPage({ reset: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ]);

    // Restore scroll position (window scroll) once after initial load
    useEffect(() => {
        if (!restoreScrollRef.current) return;
        if (initialLoading) return;
        restoreScrollRef.current = false;
        try {
            const key = isSearching ? `notifications.scroll.search.${debouncedQ.trim()}` : 'notifications.scroll.default';
            const raw = sessionStorage.getItem(key);
            const y = raw ? Number(raw) : 0;
            if (!Number.isNaN(y) && y > 0) {
                window.scrollTo({ top: y, behavior: 'instant' });
            }
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialLoading]);

    useEffect(() => {
        const onScroll = () => {
            try {
                const key = isSearching ? `notifications.scroll.search.${debouncedQ.trim()}` : 'notifications.scroll.default';
                sessionStorage.setItem(key, String(window.scrollY || 0));
            } catch {
                // ignore
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isSearching, debouncedQ]);

    // Infinite scroll trigger (IntersectionObserver)
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        if (!hasMore) return;
        if (loading) return;
        if (initialLoading) return;

        const obs = new IntersectionObserver(
            (entries) => {
                const e = entries?.[0];
                if (!e?.isIntersecting) return;
                if (loading || !hasMore) return;
                void fetchPage({ nextCursor: cursor });
            },
            {
                root: null,
                rootMargin: '600px',
                threshold: 0,
            },
        );
        obs.observe(el);
        return () => obs.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursor, hasMore, loading, initialLoading, debouncedQ]);

    const handleNotificationClick = async (n) => {
        if (!n) return;
        if (!n.isRead) await markNotificationRead(n.id);
        setItems((prev) => (Array.isArray(prev) ? prev : []).map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));

        // Chat: có sessionId → mở đúng cuộc trò chuyện
        if (n?.sessionId) {
            const qp = n?.messageId ? `&messageId=${encodeURIComponent(n.messageId)}` : '';
            navigate(`/chat?sessionId=${encodeURIComponent(n.sessionId)}${qp}`);
            return;
        }

        // Tin nhắn/offer đề xuất giá fallback (chưa có sessionId) → chat với listingId
        if (n?.refType === 'OFFER_CHAT' && n?.refId) {
            navigate(`/chat?listingId=${encodeURIComponent(n.refId)}`);
            return;
        }

        // Tin nhắn: chưa resolve session (fallback)
        if (n?.type === 'MESSAGE' && (n?.refType === 'CONVERSATION' || n?.refType === 'MESSAGE')) {
            navigate('/chat');
            return;
        }

        // Deal hoàn thành / hủy → my-listings của seller (không lộ chat ID)
        if (n?.refType === 'ORDER_HISTORY') {
            navigate('/my-listings');
            return;
        }

        // Review mới → profile của seller (người được đánh giá)
        if (n?.refType === 'SELLER_PROFILE' && (n?.refCode || n?.refId)) {
            navigate(`/profile/${n.refCode || n.refId}`);
            return;
        }

        if (n?.refType === 'LISTING' && (n?.refCode || n?.refId)) {
            navigate(`/listings/${n.refCode || n.refId}`, { state: { fromNotification: true } });
            return;
        }
        if (n?.refType === 'COMMUNITY_POST' && n?.refId) {
            navigate(`/community/posts/${n.refId}`, { state: { fromNotification: true } });
        }
    };

    const skeletons = useMemo(
        () =>
            Array.from({ length: 7 }).map((_, i) => (
                <Box
                    key={`sk-${i}`}
                    sx={{
                        p: 2.25,
                        borderRadius: '12px',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                    }}
                >
                    <Skeleton variant="text" width="85%" sx={{ bgcolor: 'rgba(255,255,255,0.12)' }} />
                    <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.10)' }} />
                </Box>
            )),
        [],
    );

    const Footer = () => (
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
            {loading ? (
                <CircularProgress size={22} sx={{ color: '#9D6EED' }} />
            ) : hasMore ? (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => void fetchPage({ nextCursor: cursor })}
                    sx={{
                        borderColor: 'rgba(157,110,237,0.6)',
                        color: '#9D6EED',
                        textTransform: 'none',
                        borderRadius: 999,
                        px: 2,
                        '&:hover': { borderColor: '#7C3AED', bgcolor: 'rgba(157,110,237,0.12)' },
                    }}
                >
                    Hiển thị thêm
                </Button>
            ) : (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Hết thông báo
                </Typography>
            )}
        </Box>
    );

    return (
        <Box
            sx={{
                px: 2,
                py: 3,
                maxWidth: 640,
                mx: 'auto',
                bgcolor: '#201D26',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 4,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#FFFFFF' }}>
                    Thông báo
                </Typography>
                {unreadCount > 0 && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DoneAllIcon />}
                        onClick={markAllRead}
                        sx={{
                            borderColor: 'rgba(157,110,237,0.6)',
                            color: '#9D6EED',
                            textTransform: 'none',
                            borderRadius: 999,
                            '&:hover': { borderColor: '#7C3AED', bgcolor: 'rgba(157,110,237,0.12)' },
                        }}
                    >
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm thông báo..."
                    fullWidth
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#9D6EED' }} />
                            </InputAdornment>
                        ),
                        endAdornment: q ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setQ('')} aria-label="Clear search" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 999,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.92)',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                            '&:hover fieldset': { borderColor: 'rgba(157,110,237,0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#9D6EED' },
                        },
                        '& input::placeholder': { color: 'rgba(255,255,255,0.55)', opacity: 1 },
                    }}
                />
                <Typography
                    variant="body2"
                    sx={{
                        display: 'block',
                        mt: 0.75,
                        minHeight: 18,
                        color: 'rgba(255,255,255,0.6)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    title={isSearching ? `Kết quả cho “${debouncedQ.trim()}”` : '30 thông báo mới nhất'}
                >
                    {isSearching ? `Kết quả cho “${debouncedQ.trim()}”` : `${pageSize} thông báo mới nhất`}
                </Typography>
            </Box>

            {initialLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{skeletons}</Box>
            ) : items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <EmptyIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.18)', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)' }} gutterBottom>
                        {isSearching ? 'Không tìm thấy thông báo phù hợp' : 'Chưa có thông báo'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {isSearching
                            ? 'Hãy thử từ khóa khác.'
                            : 'Bạn sẽ nhận thông báo khi có tin nhắn mới, người theo dõi, offer, deal xác nhận hoặc tin đăng bị báo cáo.'}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {items.map((n) => (
                        <Box key={n.id} sx={{ pb: 2 }}>
                            <Box
                                onClick={() => void handleNotificationClick(n)}
                                sx={{
                                    p: 2.25,
                                    borderRadius: '12px',
                                    bgcolor: n.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(157,110,237,0.14)',
                                    border: '1px solid',
                                    borderColor: n.isRead ? 'rgba(255,255,255,0.10)' : 'rgba(157,110,237,0.35)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    '&:hover': { bgcolor: n.isRead ? 'rgba(255,255,255,0.08)' : 'rgba(157,110,237,0.20)' },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '15.5px',
                                        lineHeight: 1.35,
                                        fontWeight: n.isRead ? 500 : 800,
                                        color: 'rgba(255,255,255,0.94)',
                                    }}
                                >
                                    {n.content}
                                </Typography>
                                <Typography sx={{ fontSize: '13px', color: 'rgba(157,110,237,0.95)', mt: 0.75, fontWeight: 600 }}>
                                    {formatNotificationTime(n.createdAt)}
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    {/* Sentinel for infinite scroll */}
                    <Box ref={sentinelRef} sx={{ height: 1 }} />

                    <Footer />
                </Box>
            )}
        </Box>
    );
}
