/** Card hiển thị listing theo layout feed (header + content + media + actions). */
import { useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    Card,
    CircularProgress,
    IconButton,
    Stack,
    Tooltip,
    Typography,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Chip,
} from '@mui/material';
import {
    BookmarkBorder as BookmarkBorderIcon,
    Bookmark as BookmarkIcon,
    FavoriteBorder,
    Favorite as FavoriteFilledIcon,
    MoreHoriz as MoreIcon,
    Flag as ReportIcon,
    Block as BlockIcon,
    Add as AddIcon,
    Check as CheckIcon,
    Person as PersonIcon,
    ChatOutlined as MessageIcon,
    ShareOutlined as ShareIconOutlined,
    ModeCommentOutlined as CommentIconOutlined,
    Collections as CollectionsIcon,
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
import BlockUserConfirmDialog from '../social/BlockUserConfirmDialog';
import { useBlockActions } from '../../hooks/useBlockActions';
import { formatPickupDisplayLine } from '../../utils/addressDisplay';
import { 
    getConditionInfo, 
    getPurposeInfo,
    getStatusInfo,
    LISTING_ICONS,
    formatRelativeShort
} from '../../utils/listingFormatUtils';

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

const getConditionInfoObj = (listing) => {
    const raw = listing?.itemCondition || listing?.condition || '';
    return getConditionInfo(raw);
};

/** Format thời gian dạng ngắn: "1m", "5h", "3d", "12 thg 3" */


export default function ListingCard({
                                        listing,
                                        onClick,
                                        cardVariant = 'default',
                                        onPatchListing,
                                    }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token, isAuthenticated, updateUser: updateAuthUser } = useAuth();
    const { followLoading, toggleFollow } = useFollowActions({ user, updateAuthUser });
    const id = listing?.id ?? listing?.listingId ?? listing?.listing_id;
    const isSavedPage = location.pathname.startsWith('/saved');
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const seller = getSeller(listing);
    const sellerId =
        listing?.sellerId ??
        seller?.userId ??
        seller?.id ??
        listing?.seller?.id ??
        listing?.seller?.userId;
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
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const { blockUserById } = useBlockActions();

    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startScrollLeftRef = useRef(0);
    const scrollContainerRef = useRef(null);
    const movedRef = useRef(0);
    const velocityRef = useRef(0);
    const lastXRef = useRef(0);
    const lastTimeRef = useRef(0);
    const animeFrameRef = useRef(null);

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

    const normalizedStatus = String(listing?.status || listing?.itemStatus || '').toUpperCase();
    const unavailableStatuses = new Set([
        'SOLD',
        'HIDDEN',
        'MOD_HIDDEN',
        'DELETED',
        'BANNED',
        'EXPIRED',
        'GIVEN_AWAY',
    ]);
    const isUnavailable = unavailableStatuses.has(normalizedStatus) || listing?.isUnavailable === true;

    const handleClick = () => {
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }

        if (onClick) onClick(listing);
        else if (id) navigate(`/listings/${id}`);
    };

    const handleFollowClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
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
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
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
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
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
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
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

    const handleMessageClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
        if (!id) return;
        if (!token) {
            showToast('Bạn cần đăng nhập để nhắn tin.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        navigate(`/chat?listingId=${id}`);
    };

    const handleMoreOpen = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
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
        if (isUnavailable) {
            showToast('Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để báo cáo tin.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setReportOpen(true);
    };

    const handleBlockMenuClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleMoreClose();
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để chặn người bán.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (!sellerId) {
            showToast('Không xác định được người bán.', 'error');
            return;
        }
        setBlockDialogOpen(true);
    };

    const handleUnsaveFromMenu = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleMoreClose();
        if (isUnavailable) {
            showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
            return;
        }
        if (!id || saveSubmitting || !isSavedPage) return;
        if (!token) {
            showToast('Bạn cần đăng nhập để tiếp tục.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        const wasSaved = isSaved;
        setIsSaved(false);
        setSaveSubmitting(true);
        try {
            await unsaveListing(id);
            onPatchListing?.(id, { isSaved: false });
            showToast('Đã bỏ lưu tin.', 'success');
        } catch {
            setIsSaved(wasSaved);
            showToast('Không cập nhật được trạng thái lưu.', 'error');
        } finally {
            setSaveSubmitting(false);
        }
    };

    const conditionObj = getConditionInfoObj(listing);
    const purposeObj = getPurposeInfo(listing?.isGiveaway, listing?.price);
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
            {/* Main Thread Container */}
            <Box sx={{ display: 'flex', p: 2, pb: 1.5, gap: 1.5 }}>
                {/* Left Column: Avatar + Follow + Thread Line */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 44 }}>
                    <Box sx={{ position: 'relative', width: 44, height: 44, mb: 1.5 }}>
                        <Tooltip title="Xem hồ sơ">
                            <Avatar
                                component={RouterLink}
                                to={String(sellerId) === String(user?.id) ? '/profile' : (sellerId ? `/profile/${sellerId}` : '#')}
                                src={fullImageUrl(seller?.avatarUrl)}
                                alt={seller?.fullName || 'seller'}
                                sx={{
                                    width: 44,
                                    height: 44,
                                    cursor: isUnavailable ? 'default' : 'pointer',
                                    textDecoration: 'none',
                                    bgcolor: '#9D6EED', // Màu Tím Slife
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                                onClick={(e) => { e.stopPropagation(); }}
                            >
                                <PersonIcon sx={{ fontSize: 24, color: 'rgba(255,255,255,0.85)' }} />
                            </Avatar>
                        </Tooltip>
                        {showFollowBtn && !isUnavailable && (
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
                    {/* Thread Line - only show if there's content to connect */}
                    <Box sx={{ flexGrow: 1, width: '2px', bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
                </Box>

                {/* Right Column: Content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                    {/* Header: Name, Time, More */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                                component={RouterLink}
                                to={String(sellerId) === String(user?.id) ? '/profile' : (sellerId ? `/profile/${sellerId}` : '#')}
                                fontSize={14.5}
                                fontWeight={600}
                                color="#FFF"
                                sx={{ textDecoration: 'none', display: 'block', '&:hover': { opacity: 0.8 } }}
                                onClick={(e) => { e.stopPropagation(); }}
                            >
                                {seller?.fullName || 'Người bán'}
                            </Typography>
                            <Typography fontSize={13} color="rgba(255,255,255,0.45)">
                                {formatRelativeShort(listing?.createdAt)}
                            </Typography>
                        </Stack>
                        {(!isMe || isSavedPage) && (
                            <Tooltip title="Tùy chọn">
                                <span>
                                    <IconButton
                                        size="small"
                                        disabled={isUnavailable}
                                        sx={{ color: 'rgba(255,255,255,0.5)', mt: -0.5, mr: -1 }}
                                        onClick={handleMoreOpen}
                                    >
                                        <MoreIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Text Content */}
                    <Box
                        onClick={handleClick}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
                        role="button"
                        tabIndex={0}
                        sx={{ cursor: isUnavailable ? 'default' : 'pointer', outline: 'none', mb: images.length ? 1.5 : 0 }}
                    >
                        <Typography fontSize={15} fontWeight={400} color="rgba(255,255,255,0.95)" sx={{ lineHeight: 1.4, mb: 0.5 }}>
                            {listing?.title || 'Không có tiêu đề'}
                        </Typography>

                        {isUnavailable && (
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', px: 1.2, py: 0.5, borderRadius: '6px', mb: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography fontSize={12} fontWeight={700} color={getStatusInfo(listing?.status).color}>
                                    {LISTING_ICONS.STATUS} {(listing?.unavailableMessage || getStatusInfo(listing?.status).label).toUpperCase()}
                                </Typography>
                            </Box>
                        )}

                        <Typography fontSize={16} fontWeight={700} color={purposeObj.color} sx={{ mb: 1 }}>
                            {purposeObj.priceText}
                        </Typography>

                        {/* Tags */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                            {!!conditionObj.label && (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', px: 1.2, py: 0.5, borderRadius: '6px' }}>
                                    <Typography fontSize={12} fontWeight={500} color={conditionObj.color}>
                                        {LISTING_ICONS.CONDITION} {conditionObj.label}
                                    </Typography>
                                </Box>
                            )}
                            {!!locationText && (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', px: 1.2, py: 0.5, borderRadius: '6px' }}>
                                    <Typography fontSize={12} fontWeight={500} color="rgba(255,255,255,0.8)">
                                        {LISTING_ICONS.LOCATION} {locationText}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Media Gallery */}
                    {!!images.length && (() => {
                        const handleMouseDown = (e) => {
                            if (!scrollContainerRef.current) return;
                            cancelAnimationFrame(animeFrameRef.current);
                            isDraggingRef.current = true;
                            movedRef.current = 0;
                            startXRef.current = e.clientX - scrollContainerRef.current.offsetLeft;
                            lastXRef.current = e.clientX;
                            lastTimeRef.current = Date.now();
                            velocityRef.current = 0;
                            startScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
                            scrollContainerRef.current.style.scrollSnapType = 'none';
                            scrollContainerRef.current.style.scrollBehavior = 'auto';
                            scrollContainerRef.current.style.cursor = 'grabbing';
                        };

                        const handleMouseMove = (e) => {
                            if (!isDraggingRef.current || !scrollContainerRef.current) return;
                            e.preventDefault();
                            const now = Date.now();
                            const dt = now - lastTimeRef.current;
                            const x = e.clientX;
                            if (dt > 0) {
                                velocityRef.current = (lastXRef.current - x) / dt;
                            }
                            lastXRef.current = x;
                            lastTimeRef.current = now;

                            const dist = (x - startXRef.current);
                            movedRef.current = Math.abs(dist);
                            scrollContainerRef.current.scrollLeft = startScrollLeftRef.current - dist;
                        };

                        const handleMouseUpOrLeave = () => {
                            if (!isDraggingRef.current || !scrollContainerRef.current) return;
                            isDraggingRef.current = false;

                            const el = scrollContainerRef.current;
                            el.style.cursor = 'grab';

                            // Momentum/Inertia
                            const momentumScroll = () => {
                                if (Math.abs(velocityRef.current) < 0.1) return;
                                el.scrollLeft += velocityRef.current * 16;
                                velocityRef.current *= 0.95; // Decay
                                animeFrameRef.current = requestAnimationFrame(momentumScroll);
                            };
                            if (Math.abs(velocityRef.current) > 0.1) {
                                animeFrameRef.current = requestAnimationFrame(momentumScroll);
                            }
                        };

                        const handleDragItemClick = (e) => {
                            if (movedRef.current > 5) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        };

                        return (
                            <Box
                                sx={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', mb: 0.5, border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <Box
                                    ref={(el) => {
                                        scrollContainerRef.current = el;
                                        if (!el) return;
                                        const onScroll = () => {
                                            const total = images.length || 0;
                                            if (total <= 1) return;
                                            const maxScroll = el.scrollWidth - el.clientWidth;
                                            const currentScroll = el.scrollLeft;
                                            const idx = maxScroll > 0 ? Math.round((currentScroll / maxScroll) * (total - 1)) : 0;
                                            const badge = el.parentElement?.querySelector('[data-img-badge]');
                                            if (badge) {
                                                const badgeText = badge.querySelector('.badge-text');
                                                if (badgeText) badgeText.textContent = `${idx + 1}/${total}`;
                                            }
                                        };
                                        el.addEventListener('scroll', onScroll, { passive: true });
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUpOrLeave}
                                    onMouseLeave={handleMouseUpOrLeave}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchMove={(e) => e.stopPropagation()}
                                    sx={{
                                        display: 'flex',
                                        overflowX: 'auto',
                                        // scrollSnapType disabled for free-scroll experience
                                        overscrollBehaviorX: 'none',
                                        touchAction: 'pan-y',
                                        cursor: 'grab',
                                        '&::-webkit-scrollbar': { display: 'none' },
                                        scrollbarWidth: 'none',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        msUserSelect: 'none',
                                        // Removed transform on whole container
                                    }}
                                >
                                    {images.map((img, idx) => (
                                        <Box
                                            key={idx}
                                            onClick={handleDragItemClick}
                                            sx={{
                                                flexShrink: 0,
                                                width: images.length === 1 ? '100%' : '50%',
                                                // scrollSnapAlign removed
                                                aspectRatio: images.length === 1 ? '4/3' : '1/1',
                                                overflow: 'hidden',
                                                mr: idx < images.length - 1 ? '4px' : 0,
                                                cursor: 'inherit',
                                                transition: 'transform 0.4s cubic-bezier(0.2, 0, 0.4, 1), opacity 0.3s ease, filter 0.3s ease',
                                                '&:active': { transform: 'scale(0.92)' }, // Individual active scale
                                                transformOrigin: 'center center',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.03)',
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
                                                    filter: 'brightness(0.92)',
                                                    transition: 'filter 0.3s ease',
                                                    '&:hover': { filter: 'brightness(1)' }
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Box>

                                {/* 1/N badge */}
                                {images.length > 1 && (
                                    <Box
                                        data-img-badge
                                        sx={{
                                            position: 'absolute', top: 10, right: 10,
                                            bgcolor: 'rgba(32, 29, 38, 0.7)', color: '#FFF',
                                            fontSize: 11, fontWeight: 700,
                                            px: 1, py: 0.5, borderRadius: '20px',
                                            pointerEvents: 'none', userSelect: 'none',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                            display: 'flex', alignItems: 'center', gap: 0.5
                                        }}
                                    >
                                        <CollectionsIcon sx={{ fontSize: 13 }} />
                                        <span className="badge-text">{`1/${images.length}`}</span>
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}

                    {/* Actions - Modern Social Feed Style */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, pt: 1 }}>
                        {/* Like */}
                        <Tooltip title={isLiked ? 'Bỏ thích' : 'Thích'}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: -1 }}>
                                <Box component="span" sx={{ display: 'inline-flex' }}>
                                    <IconButton
                                        size="small"
                                        disabled={isUnavailable || likeSubmitting}
                                        onClick={handleLikeClick}
                                        sx={{
                                            color: isLiked ? LIKE_RED : 'rgba(255,255,255,0.6)',
                                            p: 1,
                                            '&:hover': { color: LIKE_RED, bgcolor: 'rgba(255,71,87,0.1)' },
                                        }}
                                    >
                                        {isLiked ? <FavoriteFilledIcon sx={{ fontSize: 18 }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
                                    </IconButton>
                                </Box>
                                <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                                    {likeCount || 0}
                                </Typography>
                            </Box>
                        </Tooltip>

                        {/* Comment */}
                        <Tooltip title="Bình luận">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box component="span" sx={{ display: 'inline-flex' }}>
                                    <IconButton
                                        size="small"
                                        disabled={isUnavailable}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isUnavailable) {
                                                showToast(listing?.unavailableMessage || 'Tin đăng này không còn khả dụng.', 'warning');
                                                return;
                                            }
                                            setCommentOpen(true);
                                        }}
                                        sx={{ color: 'rgba(255,255,255,0.6)', p: 1, '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.1)' } }}
                                    >
                                        <CommentIconOutlined sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                                <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                                    {listing?.commentCount || 0}
                                </Typography>
                            </Box>
                        </Tooltip>

                        {/* Message Seller - hide for own listing */}
                        {!isMe && (
                            <Tooltip title="Tin nhắn">
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <IconButton
                                        size="small"
                                        disabled={isUnavailable}
                                        onClick={handleMessageClick}
                                        sx={{ color: 'rgba(255,255,255,0.6)', p: 1, '&:hover': { color: '#00BA7C', bgcolor: 'rgba(0,186,124,0.1)' } }}
                                    >
                                        <MessageIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            </Tooltip>
                        )}

                        {/* Share */}
                        <Tooltip title="Chia sẻ">
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                <IconButton
                                    size="small"
                                    onClick={handleShareClick}
                                    disabled={isUnavailable || shareSubmitting}
                                    sx={{ color: 'rgba(255,255,255,0.6)', p: 1, '&:hover': { color: '#1D9BF0', bgcolor: 'rgba(29,155,240,0.1)' } }}
                                >
                                    <ShareIconOutlined sx={{ fontSize: 19 }} />
                                </IconButton>
                            </Box>
                        </Tooltip>

                        {/* Bookmark */}
                        {!isSavedPage && (
                            <Tooltip title={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}>
                                <Box component="span" sx={{ display: 'inline-flex', ml: 'auto' }}>
                                    <IconButton
                                        size="small"
                                        disabled={isUnavailable || saveSubmitting}
                                        onClick={handleSaveClick}
                                        sx={{
                                            color: isSaved ? PURPLE : 'rgba(255,255,255,0.6)',
                                            p: 1,
                                            '&:hover': { color: PURPLE, bgcolor: 'rgba(157,110,237,0.1)' },
                                        }}
                                    >
                                        {isSaved ? <BookmarkIcon sx={{ fontSize: 18 }} /> : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
                                    </IconButton>
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            </Box>
            <CommentModal
                open={commentOpen && !isUnavailable}
                onClose={() => setCommentOpen(false)}
                listingId={id}
                listing={listing}
            />

            {(!isMe || isSavedPage) && (
                <>
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
                        {isSavedPage && isSaved && (
                            <MenuItem onClick={handleUnsaveFromMenu} disabled={saveSubmitting || isUnavailable}>
                                <ListItemIcon sx={{ color: '#E9D5FF', minWidth: '32px !important' }}>
                                    <BookmarkIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Bỏ lưu" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
                            </MenuItem>
                        )}
                        {!isMe && !!sellerId && (
                            <MenuItem onClick={handleBlockMenuClick}>
                                <ListItemIcon sx={{ color: 'rgba(255,180,180,0.95)', minWidth: '32px !important' }}>
                                    <BlockIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Chặn người bán" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
                            </MenuItem>
                        )}
                        {!isMe && (
                            <MenuItem onClick={handleReportClick}>
                                <ListItemIcon sx={{ color: '#FF4757', minWidth: '32px !important' }}>
                                    <ReportIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Báo cáo" primaryTypographyProps={{ fontSize: 14 }} />
                            </MenuItem>
                        )}
                    </Menu>

                    <ReportDialog
                        open={reportOpen}
                        onClose={() => setReportOpen(false)}
                        targetType="LISTING"
                        targetId={id}
                        targetTitle={listing?.title}
                    />

                    {!isMe && sellerId && (
                        <BlockUserConfirmDialog
                            open={blockDialogOpen}
                            onClose={() => setBlockDialogOpen(false)}
                            displayName={seller?.fullName || 'Người bán'}
                            onConfirm={() =>
                                blockUserById(sellerId).then(() => {
                                    onPatchListing?.(id, { removeFromList: true });
                                    const onListingDetail = /^\/listings\/[^/]+$/.test(location.pathname);
                                    if (onListingDetail) navigate('/feed');
                                })
                            }
                        />
                    )}
                </>
            )}
        </Card>
    );
}
