/**
 * SCRUM-172: Trang danh sách thông báo đầy đủ.
 */
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    TextField,
    Typography,
} from '@mui/material';
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

const TYPE_FILTER_OPTIONS = [
    { value: 'ALL', label: 'Tất cả loại' },
    { value: 'MESSAGE', label: 'Tin nhắn' },
    { value: 'DEAL', label: 'Deal / Đơn hàng' },
    { value: 'SOCIAL', label: 'Theo dõi / Tương tác' },
    { value: 'LISTING', label: 'Tin đăng' },
    { value: 'SYSTEM', label: 'Hệ thống' },
    { value: 'OTHER', label: 'Khác' },
];

const detectNotificationType = (n) => {
    const type = String(n?.type || '').toUpperCase();
    const refType = String(n?.refType || '').toUpperCase();

    if (n?.sessionId || refType === 'MESSAGE' || refType === 'CONVERSATION' || refType === 'OFFER_CHAT' || type === 'MESSAGE') {
        return 'MESSAGE';
    }
    if (refType === 'ORDER_HISTORY' || type.includes('DEAL') || type.includes('ORDER') || type.includes('OFFER')) {
        return 'DEAL';
    }
    if (refType === 'SELLER_PROFILE' || type.includes('FOLLOW') || type.includes('LIKE') || type.includes('COMMENT')) {
        return 'SOCIAL';
    }
    if (refType === 'LISTING' || type.includes('LISTING') || type.includes('REPORT')) {
        return 'LISTING';
    }
    if (type.includes('SYSTEM') || type.includes('ADMIN') || type.includes('CONFIG')) {
        return 'SYSTEM';
    }
    return 'OTHER';
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
    const [readFilter, setReadFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST');
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
            const filters = { readFilter, typeFilter, sortBy };
            const resp = isSearching
                ? await searchNotificationsPage({ q: debouncedQ.trim(), limit: pageSize, cursor: nextCursor || undefined, ...filters })
                : await getNotificationsPage({ limit: pageSize, cursor: nextCursor || undefined, ...filters });
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
    }, [debouncedQ, readFilter, typeFilter, sortBy]);

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

    const filteredItems = useMemo(() => {
        let list = Array.isArray(items) ? [...items] : [];

        if (readFilter === 'UNREAD') {
            list = list.filter((n) => !n?.isRead);
        } else if (readFilter === 'READ') {
            list = list.filter((n) => Boolean(n?.isRead));
        }

        if (typeFilter !== 'ALL') {
            list = list.filter((n) => detectNotificationType(n) === typeFilter);
        }

        list.sort((a, b) => {
            const ta = new Date(a?.createdAt || 0).getTime();
            const tb = new Date(b?.createdAt || 0).getTime();
            return sortBy === 'OLDEST' ? ta - tb : tb - ta;
        });

        return list;
    }, [items, readFilter, typeFilter, sortBy]);

    const activeFilterCount =
        (readFilter !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0) + (sortBy !== 'NEWEST' ? 1 : 0);

    const resetFilters = () => {
        setReadFilter('ALL');
        setTypeFilter('ALL');
        setSortBy('NEWEST');
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
                width: '100%',
                px: { xs: 1.5, md: 3 },
                py: { xs: 2.5, md: 3.5 },
                maxWidth: '100%',
                mx: 'auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                        Thông báo
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.75 }}>
                        Theo dõi cập nhật từ người theo dõi, tin nhắn, deal và tin đăng của bạn.
                    </Typography>
                </Box>
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
                            alignSelf: { xs: 'stretch', md: 'center' },
                            '&:hover': { borderColor: '#7C3AED', bgcolor: 'rgba(157,110,237,0.12)' },
                        }}
                    >
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </Box>

            <Box
                sx={{
                    mb: 2.5,
                    display: 'flex',
                    flexDirection: { xs: 'column', xl: 'row' },
                    gap: 1.75,
                    alignItems: { xs: 'stretch', xl: 'center' },
                }}
            >
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
                                <IconButton size="small" onClick={() => setQ('')} aria-label="Xóa tìm kiếm" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                    sx={{
                        width: { xs: '100%', xl: 'min(620px, 100%)' },
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

                <Box
                    sx={{
                        display: 'grid',
                        gap: 1,
                        alignItems: 'center',
                        justifyContent: { xs: 'flex-start', xl: 'flex-end' },
                        flex: 1,
                        pl: { xl: 2 },
                        borderLeft: { xl: '1px solid rgba(255,255,255,0.08)' },
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(160px, 1fr))',
                            lg: 'repeat(3, minmax(160px, 1fr))',
                        },
                    }}
                >
                    <FormControl size="small" fullWidth>
                        <InputLabel id="notification-read-filter-label" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Trạng thái
                        </InputLabel>
                        <Select
                            labelId="notification-read-filter-label"
                            value={readFilter}
                            label="Trạng thái"
                            onChange={(e) => setReadFilter(e.target.value)}
                            sx={{
                                color: 'rgba(255,255,255,0.92)',
                                borderRadius: 999,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                                '&:hover fieldset': { borderColor: 'rgba(157,110,237,0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#9D6EED' },
                            }}
                        >
                            <MenuItem value="ALL">Tất cả</MenuItem>
                            <MenuItem value="UNREAD">Chưa đọc</MenuItem>
                            <MenuItem value="READ">Đã đọc</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                        <InputLabel id="notification-type-filter-label" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Loại thông báo
                        </InputLabel>
                        <Select
                            labelId="notification-type-filter-label"
                            value={typeFilter}
                            label="Loại thông báo"
                            onChange={(e) => setTypeFilter(e.target.value)}
                            sx={{
                                color: 'rgba(255,255,255,0.92)',
                                borderRadius: 999,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                                '&:hover fieldset': { borderColor: 'rgba(157,110,237,0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#9D6EED' },
                            }}
                        >
                            {TYPE_FILTER_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                        <InputLabel id="notification-sort-label" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Sắp xếp
                        </InputLabel>
                        <Select
                            labelId="notification-sort-label"
                            value={sortBy}
                            label="Sắp xếp"
                            onChange={(e) => setSortBy(e.target.value)}
                            sx={{
                                color: 'rgba(255,255,255,0.92)',
                                borderRadius: 999,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                                '&:hover fieldset': { borderColor: 'rgba(157,110,237,0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#9D6EED' },
                            }}
                        >
                            <MenuItem value="NEWEST">Mới nhất</MenuItem>
                            <MenuItem value="OLDEST">Cũ nhất</MenuItem>
                        </Select>
                    </FormControl>

                    {activeFilterCount > 0 && (
                        <Button
                            variant="text"
                            onClick={resetFilters}
                            sx={{
                                textTransform: 'none',
                                color: 'rgba(255,255,255,0.75)',
                                borderRadius: 999,
                                px: 1.5,
                                justifySelf: { xs: 'start', lg: 'end' },
                            }}
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                </Box>
            </Box>

            <Box
                sx={{
                    width: '100%',
                    bgcolor: '#201D26',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    p: { xs: 2, md: 3 },
                    minHeight: 420,
                }}
            >
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
                ) : filteredItems.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <EmptyIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.16)', mb: 1.5 }} />
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)' }} gutterBottom>
                            Không có thông báo khớp bộ lọc
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Hãy đổi điều kiện lọc hoặc bấm “Xóa bộ lọc”.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                mb: 0.5,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    px: 1.25,
                                    py: 0.55,
                                    borderRadius: 999,
                                    bgcolor: 'rgba(157,110,237,0.12)',
                                    border: '1px solid rgba(157,110,237,0.38)',
                                }}
                            >
                                <Typography variant="caption" sx={{ color: 'rgba(157,110,237,0.95)', fontWeight: 700, letterSpacing: '0.02em' }}>
                                    {isSearching ? 'KẾT QUẢ TÌM KIẾM' : 'THÔNG BÁO MỚI NHẤT'}
                                </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)', fontWeight: 600 }}>
                                {filteredItems.length} mục hiển thị
                            </Typography>
                        </Box>

                        {filteredItems.map((n) => (
                            <Box
                                key={n.id}
                                onClick={() => void handleNotificationClick(n)}
                                sx={{
                                    p: { xs: 2, md: 2.25 },
                                    borderRadius: '14px',
                                    bgcolor: n.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(157,110,237,0.14)',
                                    border: '1px solid',
                                    borderColor: n.isRead ? 'rgba(255,255,255,0.10)' : 'rgba(157,110,237,0.35)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'background 0.2s, transform 0.2s',
                                    '&:hover': {
                                        bgcolor: n.isRead ? 'rgba(255,255,255,0.08)' : 'rgba(157,110,237,0.20)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: 10,
                                        bottom: 10,
                                        width: 3,
                                        borderRadius: 999,
                                        bgcolor: n.isRead ? 'transparent' : 'rgba(157,110,237,0.9)',
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '15.5px',
                                        lineHeight: 1.4,
                                        fontWeight: n.isRead ? 500 : 800,
                                        color: 'rgba(255,255,255,0.94)',
                                        pr: { xs: 0, md: 2 },
                                    }}
                                >
                                    {n.content}
                                </Typography>
                                <Typography sx={{ fontSize: '13px', color: 'rgba(157,110,237,0.95)', mt: 0.9, fontWeight: 600 }}>
                                    {formatNotificationTime(n.createdAt)}
                                </Typography>
                            </Box>
                        ))}

                        {filteredItems.length <= 2 && !loading && (
                            <Box
                                sx={{
                                    mt: 0.75,
                                    px: { xs: 1.5, md: 2 },
                                    py: 1.35,
                                    borderRadius: 2,
                                    border: '1px dashed rgba(255,255,255,0.16)',
                                    bgcolor: 'rgba(255,255,255,0.025)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.58)' }}>
                                    Bạn đã xem gần hết thông báo. Hãy quay lại sau để xem cập nhật mới.
                                </Typography>
                            </Box>
                        )}

                        {/* Sentinel for infinite scroll */}
                        <Box ref={sentinelRef} sx={{ height: 1 }} />

                        <Footer />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
