/** Card hiển thị listing theo layout feed (header + content + media + actions). */
import { useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    Stack,
    Tooltip,
    Typography,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    BookmarkBorder as BookmarkBorderIcon,
    Bookmark as BookmarkIcon,
    FavoriteBorder,
    Favorite as FavoriteFilledIcon,
    MoreHoriz as MoreIcon,
    Share as ShareIcon,
    Flag as ReportIcon,
    Add as AddIcon,
    Check as CheckIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    ChatOutlined as MessageIcon,
    NearMeOutlined as SendOutlinedIcon,
    ModeCommentOutlined as CommentIconOutlined,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';
import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import { useToast } from '../../context/ToastContext';
import { getListingShareInfo, saveListing, toggleListingLike, unsaveListing } from '../../api/listingApi';
import CommentModal from './CommentModal';
import ReportDialog from '../report/ReportDialog';

const LIKE_RED = '#FF4757';
const PURPLE = '#9D6EED';

/** Bóc payload toggle like từ ApiResponse / snake_case / lồng nhẹ. */
function parseToggleLikePayload(res) {
    let raw = unwrapApiData(res);
    if (raw && typeof raw === 'object' && raw.data != null && typeof raw.data === 'object') {
        const inner = raw.data;
        if ('liked' in inner || 'likeCount' in inner || 'like_count' in inner || 'isLiked' in inner) {
            raw = inner;
        }
    }
    if (!raw || typeof raw !== 'object') return { nextLiked: undefined, nextCount: undefined };
    const nextLiked = raw.liked ?? raw.isLiked ?? raw.is_liked;
    const nextCount = raw.likeCount ?? raw.like_count;
    return {
        nextLiked: typeof nextLiked === 'boolean' ? nextLiked : undefined,
        nextCount: nextCount != null && nextCount !== '' ? Number(nextCount) : undefined,
    };
}

function normalizeShareUrl(rawUrl, fallbackId) {
    try {
        const parsed = new URL(rawUrl || '', window.location.origin);
        // Luôn dùng origin hiện tại (localhost, domain staging/prod, cổng nginx...)
        // để tránh link BE trả về localhost:5173 không truy cập được từ máy client.
        return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return `${window.location.origin}/listings/${fallbackId}`;
    }
}

const toCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const getSeller = (listing) => {
    const sellerSummary = listing?.sellerSummary;
    const seller = listing?.seller;

    if (sellerSummary && typeof sellerSummary === 'object') return sellerSummary;
    if (seller && typeof seller === 'object') return seller;

    return {
        fullName: typeof sellerSummary === 'string' ? sellerSummary : undefined,
    };
};

const getLocationText = (listing) => {
    const location = listing?.location;
    if (typeof location === 'string' && location.trim()) return location;

    const pickupAddress = listing?.pickupAddress;
    if (typeof pickupAddress === 'string' && pickupAddress.trim()) return pickupAddress;
    if (pickupAddress && typeof pickupAddress === 'object') {
        return formatPickupDisplayLine(
            pickupAddress.locationName ?? pickupAddress.location_name,
            pickupAddress.addressText ?? pickupAddress.address_text,
        );
    }

    return '';
};

const CONDITION_LABELS = {
    NEW: 'Hàng mới',
    USED_LIKE_NEW: 'Như mới',
    USED_GOOD: 'Đã qua sử dụng',
    USED_FAIR: 'Đã qua sử dụng',
    USED: 'Đã qua sử dụng',
    SECOND_HAND: 'Đã qua sử dụng',
};

const getConditionText = (listing) => {
    const raw = listing?.itemCondition || listing?.condition || '';
    return CONDITION_LABELS[raw?.toUpperCase?.()] ?? raw;
};

/** Format thời gian dạng ngắn: "1m", "5h", "3d", "12 thg 3" */
const formatRelativeShort = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
};


export default function ListingCard({
    listing,
    onClick,
    cardVariant = 'default',
    layout = 'list',
    imageAspect,
    onPatchListing,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token, isAuthenticated, updateUser: updateAuthUser } = useAuth();
    const { followLoading, toggleFollow } = useFollowActions({ user, updateAuthUser });
    const id = listing?.id ?? listing?.listingId ?? listing?.listing_id;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const seller = getSeller(listing);
    const sellerId = listing?.sellerId ?? seller?.userId ?? seller?.id ?? listing?.seller?.id;
    const isMe = isAuthenticated && user && sellerId && String(user.id) === String(sellerId);
    const [followed, setFollowed] = useState(!!listing?.isFollowed);
    const [commentOpen, setCommentOpen] = useState(false);
    const [likeCount, setLikeCount] = useState(() => Number(listing?.likeCount ?? listing?.like_count ?? 0));
    const [isLiked, setIsLiked] = useState(() => !!(listing?.isLiked ?? listing?.is_liked));
    const [likeSubmitting, setLikeSubmitting] = useState(false);
    const [isSaved, setIsSaved] = useState(() => !!(listing?.isSaved ?? listing?.is_saved));
    const [saveSubmitting, setSaveSubmitting] = useState(false);
    const [shareSubmitting, setShareSubmitting] = useState(false);

    const [moreAnchorEl, setMoreAnchorEl] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        setFollowed(!!listing?.isFollowed);
    }, [listing?.id, listing?.isFollowed]);

    useEffect(() => {
        setLikeCount(Number(listing?.likeCount ?? listing?.like_count ?? 0));
        setIsLiked(Boolean(listing?.isLiked ?? listing?.is_liked));
    }, [listing?.id, listing?.likeCount, listing?.like_count, listing?.isLiked, listing?.is_liked]);

    useEffect(() => {
        setIsSaved(Boolean(listing?.isSaved ?? listing?.is_saved));
    }, [listing?.id, listing?.isSaved, listing?.is_saved]);

    const handleClick = () => {
        if (onClick) onClick(listing);
        else if (id) navigate(`/listings/${id}`);
    };

    const handleFollowClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!sellerId || isMe) return;
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để theo dõi người bán.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        await toggleFollow({
            targetUserId: sellerId,
            isFollowing: followed,
            isAuthenticated,
            onSuccess: (nextIsFollowing) => setFollowed(nextIsFollowing),
            onError: () => {
                /* silent — optional toast at feed level */
            },
        });
    };

    const handleLikeClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!id) return;
        // Dùng token (axios cũng gắn Bearer) — tránh trường hợp có JWT nhưng user object chưa hydrate.
        if (!token) {
            showToast('Bạn cần đăng nhập để tiếp tục.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (likeSubmitting) return;

        const prevLiked = isLiked;
        const prevCount = likeCount;
        setIsLiked(!prevLiked);
        setLikeCount(Math.max(0, prevCount + (prevLiked ? -1 : 1)));
        setLikeSubmitting(true);

        try {
            const res = await toggleListingLike(id);
            const { nextLiked, nextCount } = parseToggleLikePayload(res);
            const finalLiked = typeof nextLiked === 'boolean' ? nextLiked : !prevLiked;
            const finalCount =
                nextCount != null && !Number.isNaN(nextCount)
                    ? nextCount
                    : Math.max(0, prevCount + (prevLiked ? -1 : 1));
            setIsLiked(finalLiked);
            setLikeCount(finalCount);
            onPatchListing?.(id, { likeCount: finalCount, isLiked: finalLiked });
        } catch {
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
        } finally {
            setLikeSubmitting(false);
        }
    };

    const handleShareClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!id || shareSubmitting) return;
        setShareSubmitting(true);
        let shareUrl = `${window.location.origin}/listings/${id}`;
        let shareTitle = listing?.title || 'Tin đăng';
        try {
            // Prefer backend-generated canonical URL.
            const res = await getListingShareInfo(id);
            const payload = unwrapApiData(res);
            const data = payload?.data ?? payload;
            shareUrl = normalizeShareUrl(data?.shareUrl, id);
            shareTitle = data?.title || data?.listing?.title || shareTitle;
        } catch {
            // Non-blocking: fallback to FE URL.
        }
        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    url: shareUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
            showToast('Đã sao chép liên kết bài đăng.', 'success');
        } catch {
            // Final fallback: manual copy dialog.
            window.prompt('Sao chép liên kết bài đăng:', shareUrl);
            showToast('Trình duyệt chặn sao chép tự động. Hãy sao chép thủ công.', 'warning');
        } finally {
            window.setTimeout(() => setShareSubmitting(false), 800);
        }
    };

    const handleSaveClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!id || saveSubmitting) return;
        if (!token) {
            showToast('Bạn cần đăng nhập để tiếp tục.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        const wasSaved = isSaved;
        setIsSaved(!wasSaved);
        setSaveSubmitting(true);
        try {
            if (wasSaved) {
                await unsaveListing(id);
            } else {
                await saveListing(id);
            }
            const nextSaved = !wasSaved;
            onPatchListing?.(id, { isSaved: nextSaved });
            showToast(nextSaved ? 'Đã lưu tin.' : 'Đã bỏ lưu tin.', 'success');
        } catch {
            setIsSaved(wasSaved);
            showToast('Không cập nhật được trạng thái lưu.', 'error');
        } finally {
            setSaveSubmitting(false);
        }
    };

    const handleMoreOpen = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setMoreAnchorEl(e.currentTarget);
    };

    const handleMoreClose = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setMoreAnchorEl(null);
    };

    const handleReportClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleMoreClose();
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để báo cáo tin.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setReportOpen(true);
    };

    const conditionText = getConditionText(listing);
    const locationText = getLocationText(listing);
    const showFollowBtn = sellerId && !isMe;

    return (
        <Card
            sx={{
                width: '100%',
                maxWidth: cardVariant === 'fullWidth' ? 'none' : 640,
                mx: cardVariant === 'fullWidth' ? 0 : 'auto',
                bgcolor: '#201D26',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Avatar + Follow badge */}
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Tooltip title="Xem hồ sơ">
                            <Avatar
                                component={RouterLink}
                                to={String(sellerId) === String(user?.id) ? '/profile' : (sellerId ? `/profile/${sellerId}` : '#')}
                                src={fullImageUrl(seller?.avatarUrl)}
                                alt={seller?.fullName || 'seller'}
                                sx={{ width: 44, height: 44, cursor: 'pointer', textDecoration: 'none', bgcolor: '#9D6EED' }}
                                onClick={(e) => { e.stopPropagation(); }}
                            >
                                {seller?.fullName ? seller.fullName.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                        </Tooltip>
                        {showFollowBtn && (
                            <Tooltip title={followed ? 'Bỏ theo dõi' : 'Theo dõi'}>
                                <Box
                                    component="span"
                                    onClick={handleFollowClick}
                                    sx={{
                                        position: 'absolute',
                                        bottom: -1,
                                        right: -1,
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        bgcolor: followed ? '#9D6EED' : '#FFF',
                                        border: '1.5px solid #201D26',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: followed ? '#FFF' : '#201D26',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                        transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        '&:hover': { transform: 'scale(1.15)', opacity: 1 },
                                        zIndex: 2,
                                    }}
                                >
                                    {followLoading ? (
                                        <CircularProgress size={12} color="inherit" />
                                    ) : followed ? (
                                        <CheckIcon sx={{ fontSize: 16, fontWeight: 900 }} />
                                    ) : (
                                        <AddIcon sx={{ fontSize: 18, fontWeight: 900 }} />
                                    )}
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                    <Box>
                        <Typography
                            component={RouterLink}
                            to={String(sellerId) === String(user?.id) ? '/profile' : (sellerId ? `/profile/${sellerId}` : '#')}
                            fontSize={14.5}
                            fontWeight={600}
                            color="#FFF"
                            sx={{ textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}
                            onClick={(e) => { e.stopPropagation(); }}
                        >
                            {seller?.fullName || 'Người bán'}
                        </Typography>
                        <Typography fontSize={12} color="rgba(255,255,255,0.45)" sx={{ lineHeight: 1.2 }}>
                            {formatRelativeShort(listing?.createdAt) || 'Vừa đăng'}
                        </Typography>
                    </Box>
                </Stack>
                <Tooltip title="Tùy chọn">
                    <IconButton
                        size="small"
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                        onClick={handleMoreOpen}
                    >
                        <MoreIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box
                onClick={handleClick}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
                role="button"
                tabIndex={0}
                sx={{ cursor: 'pointer', outline: 'none' }}
            >
                {/* Image Gallery — horizontal scroll with arrow buttons */}
                {!!images.length && (() => {
                    const scrollRef = { current: null };
                    const scrollBy = (dir) => {
                        if (!scrollRef.current) return;
                        const w = scrollRef.current.clientWidth;
                        scrollRef.current.scrollBy({ left: dir * w * 0.85, behavior: 'smooth' });
                    };
                    return (
                        <Box sx={{ position: 'relative', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                            <Box
                                ref={(el) => {
                                    scrollRef.current = el;
                                    if (!el) return;
                                    const onScroll = () => {
                                        const w = el.clientWidth * 0.85;
                                        const idx = w > 0 ? Math.round(el.scrollLeft / w) : 0;
                                        const badge = el.parentElement?.querySelector('[data-img-badge]');
                                        if (badge) badge.textContent = `${idx + 1}/${images.length}`;
                                    };
                                    el.addEventListener('scroll', onScroll, { passive: true });
                                }}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                                sx={{
                                    display: 'flex',
                                    overflowX: 'auto',
                                    scrollSnapType: 'x mandatory',
                                    overscrollBehaviorX: 'none',
                                    touchAction: 'pan-y',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    scrollbarWidth: 'none',
                                }}
                            >
                                {images.map((img, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            flexShrink: 0,
                                            width: images.length === 1 ? '100%' : '85%',
                                            scrollSnapAlign: 'start',
                                            aspectRatio: '16/9',
                                            overflow: 'hidden',
                                            mr: idx < images.length - 1 ? '4px' : 0,
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={fullImageUrl(img)}
                                            alt={`${listing?.title} ${idx + 1}`}
                                            loading="lazy"
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                                pointerEvents: 'none',
                                                userSelect: 'none',
                                                WebkitUserDrag: 'none',
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>

                            {/* Arrow navigation (mouse only) */}
                            {images.length > 1 && (
                                <>
                                    <Box
                                        onClick={(e) => { e.stopPropagation(); scrollBy(-1); }}
                                        sx={{
                                            position: 'absolute', left: 8, top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 32, height: 32, borderRadius: '50%',
                                            bgcolor: 'rgba(32, 29, 38, 0.6)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#fff',
                                            userSelect: 'none', zIndex: 2,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: 'rgba(157, 110, 237, 0.8)', transform: 'translateY(-50%) scale(1.1)' },
                                        }}
                                    >
                                        <ChevronLeftIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Box
                                        onClick={(e) => { e.stopPropagation(); scrollBy(1); }}
                                        sx={{
                                            position: 'absolute', right: 8, top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 32, height: 32, borderRadius: '50%',
                                            bgcolor: 'rgba(32, 29, 38, 0.6)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#fff',
                                            userSelect: 'none', zIndex: 2,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: 'rgba(157, 110, 237, 0.8)', transform: 'translateY(-50%) scale(1.1)' },
                                        }}
                                    >
                                        <ChevronRightIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                </>
                            )}

                            {/* 1/N badge */}
                            {images.length > 1 && (
                                <Box
                                    data-img-badge
                                    sx={{
                                        position: 'absolute', top: 10, right: 10,
                                        bgcolor: 'rgba(32, 29, 38, 0.7)', color: '#FFF',
                                        fontSize: 11, fontWeight: 700,
                                        px: 1.2, py: 0.5, borderRadius: '20px',
                                        pointerEvents: 'none', userSelect: 'none',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                    }}
                                >
                                    {`1/${images.length}`}
                                </Box>
                            )}
                        </Box>
                    );
                })()}

                {/* Content */}
                <CardContent sx={{ pt: 2, pb: 1, px: 2, flexGrow: 1 }}>
                    <Typography fontSize={16} fontWeight={600} color="rgba(255,255,255,0.95)" sx={{ lineHeight: 1.4, mb: 0.5 }}>
                        {listing?.title || 'Không có tiêu đề'}
                    </Typography>

                    <Typography fontSize={18} fontWeight={700} color="#FF4757" sx={{ mb: 1 }}>
                        {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
                    </Typography>

                    {/* Description intentionally omitted on Feed — shown only on Detail page */}

                    {/* Tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {!!conditionText && (
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', px: 1.2, py: 0.5, borderRadius: '6px' }}>
                                <Typography fontSize={12} fontWeight={500} color="rgba(255,255,255,0.8)">
                                    🏷 {conditionText}
                                </Typography>
                            </Box>
                        )}
                        {!!locationText && (
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', px: 1.2, py: 0.5, borderRadius: '6px' }}>
                                <Typography fontSize={12} fontWeight={500} color="rgba(255,255,255,0.8)">
                                    📍 {locationText}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Box>

            {/* Actions - Modern Social Feed Style */}
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 3.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Like */}
                <Tooltip title={isLiked ? 'Bỏ thích' : 'Thích'}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            disabled={likeSubmitting}
                            onClick={handleLikeClick}
                            sx={{
                                color: isLiked ? LIKE_RED : 'rgba(255,255,255,0.6)',
                                p: 0.5,
                                '&:hover': { color: LIKE_RED, bgcolor: 'rgba(255,71,87,0.1)' },
                            }}
                        >
                            {isLiked ? <FavoriteFilledIcon sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
                        </IconButton>
                        <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                            {likeCount || 0}
                        </Typography>
                    </Box>
                </Tooltip>

                {/* Comment */}
                <Tooltip title="Bình luận">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setCommentOpen(true); }}
                            sx={{ color: 'rgba(255,255,255,0.6)', p: 0.5, '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.1)' } }}
                        >
                            <CommentIconOutlined sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                            {listing?.commentCount || 0}
                        </Typography>
                    </Box>
                </Tooltip>

                {/* Message Seller */}
                <Tooltip title="Tin nhắn">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (sellerId) navigate(`/profile/${sellerId}?chat=true`);
                            }}
                            sx={{ color: 'rgba(255,255,255,0.6)', p: 0.5, '&:hover': { color: '#00BA7C', bgcolor: 'rgba(0,186,124,0.1)' } }}
                        >
                            <MessageIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                </Tooltip>

                {/* Share/Send */}
                <Tooltip title="Chia sẻ">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            size="small"
                            onClick={handleShareClick}
                            disabled={shareSubmitting}
                            sx={{ color: 'rgba(255,255,255,0.6)', p: 0.5, '&:hover': { color: '#1D9BF0', bgcolor: 'rgba(29,155,240,0.1)' } }}
                        >
                            <SendOutlinedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                </Tooltip>

                {/* Bookmark (Moved to right) */}
                <Tooltip title={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}>
                    <IconButton
                        size="small"
                        disabled={saveSubmitting}
                        onClick={handleSaveClick}
                        sx={{
                            ml: 'auto',
                            color: isSaved ? PURPLE : 'rgba(255,255,255,0.6)',
                            p: 0.5,
                            '&:hover': { color: PURPLE, bgcolor: 'rgba(157,110,237,0.1)' },
                        }}
                    >
                        {isSaved ? <BookmarkIcon sx={{ fontSize: 20 }} /> : <BookmarkBorderIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                </Tooltip>
            </Box>

            <CommentModal
                open={commentOpen}
                onClose={() => setCommentOpen(false)}
                listingId={id}
                listing={listing}
            />

            <Menu
                anchorEl={moreAnchorEl}
                open={Boolean(moreAnchorEl)}
                onClose={handleMoreClose}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                    sx: {
                        bgcolor: '#25232C',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                        minWidth: 160,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                    }
                }}
            >
                <MenuItem onClick={handleReportClick}>
                    <ListItemIcon sx={{ color: '#FF4757', minWidth: '32px !important' }}>
                        <ReportIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Báo cáo" primaryTypographyProps={{ fontSize: 14 }} />
                </MenuItem>
            </Menu>

            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetType="LISTING"
                targetId={id}
                targetTitle={listing?.title}
            />
        </Card>
    );
}
