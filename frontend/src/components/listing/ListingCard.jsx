/** Card hiển thị listing theo layout feed (header + content + media + actions). */
import { useEffect, useState } from 'react';
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
    ChatBubbleOutline as CommentIcon,
    BookmarkBorder as BookmarkBorderIcon,
    Bookmark as BookmarkIcon,
    FavoriteBorder,
    Favorite as FavoriteFilledIcon,
    MoreHoriz as MoreIcon,
    Send as SendIcon,
    Share as ShareIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    Flag as ReportIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';
import { formatPickupDisplayLine } from '../../utils/addressDisplay';
import { formatDate } from '../../utils/formatDate';
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

const getConditionText = (listing) =>
    listing?.itemCondition || listing?.condition || listing?.status || '';


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
                    <Avatar
                        component={RouterLink}
                        to={String(sellerId) === String(user?.id) ? '/profile' : (sellerId ? `/profile/${sellerId}` : '#')}
                        src={fullImageUrl(seller?.avatarUrl)}
                        alt={seller?.fullName || 'seller'}
                        sx={{ width: 40, height: 40, cursor: 'pointer', textDecoration: 'none', bgcolor: '#9D6EED' }}
                        onClick={(e) => { e.stopPropagation(); }}
                    >
                        {seller?.fullName ? seller.fullName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography
                            component={RouterLink}
                            to={String(sellerId) === String(user?.id) ? '/profile' : (sellerId ? `/profile/${sellerId}` : '#')}
                            fontSize={14.5}
                            fontWeight={600}
                            color="#FFF"
                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            onClick={(e) => { e.stopPropagation(); }}
                        >
                            {seller?.fullName || 'Người bán'}
                        </Typography>
                        <Typography fontSize={13} color="rgba(255,255,255,0.5)">
                            • {formatDate(listing?.createdAt) || 'Vừa đăng'}
                        </Typography>
                    </Box>
                </Stack>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {showFollowBtn && (
                        <Tooltip title={followed ? 'Bỏ theo dõi' : 'Theo dõi người bán'}>
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={followLoading}
                                    onClick={handleFollowClick}
                                    sx={{
                                        color: followed ? '#9D6EED' : 'rgba(255,255,255,0.5)',
                                        '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.12)' },
                                    }}
                                >
                                    {followLoading ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : followed ? (
                                        <PersonRemoveIcon fontSize="small" />
                                    ) : (
                                        <PersonAddIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                    <IconButton 
                        size="small" 
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                        onClick={handleMoreOpen}
                    >
                        <MoreIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box
                onClick={handleClick}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
                role="button"
                tabIndex={0}
                sx={{ cursor: 'pointer', outline: 'none' }}
            >
                {/* Images */}
                {!!images.length && (
                    <Box
                        sx={{
                            width: '100%',
                            position: 'relative',
                            pt:
                                layout === 'grid'
                                    ? '65%'
                                    : imageAspect === 'compactList'
                                        ? '45%'
                                        : '65%',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            component="img"
                            src={fullImageUrl(images[0])}
                            alt={listing?.title}
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                        />
                    </Box>
                )}

                {/* Content */}
                <CardContent sx={{ pt: 2, pb: 1, px: 2, flexGrow: 1 }}>
                    <Typography fontSize={16} fontWeight={600} color="rgba(255,255,255,0.95)" sx={{ lineHeight: 1.4, mb: 0.5 }}>
                        {listing?.title || 'Không có tiêu đề'}
                    </Typography>

                    <Typography fontSize={18} fontWeight={700} color="#FF4757" sx={{ mb: 1 }}>
                        {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
                    </Typography>

                    {!!listing?.description && (
                        <Typography fontSize={14} color="rgba(255,255,255,0.7)" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5 }}>
                            {listing?.description || listing?.content || ''}
                        </Typography>
                    )}

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

            {/* Actions */}
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Tooltip title={isLiked ? 'Bỏ thích' : 'Thích'}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        <IconButton
                            size="small"
                            disabled={likeSubmitting}
                            onClick={handleLikeClick}
                            sx={{
                                color: isLiked ? LIKE_RED : 'rgba(255,255,255,0.6)',
                                '&:hover': { color: LIKE_RED, bgcolor: 'rgba(255,71,87,0.12)' },
                            }}
                        >
                            {likeSubmitting ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : isLiked ? (
                                <FavoriteFilledIcon fontSize="small" />
                            ) : (
                                <FavoriteBorder fontSize="small" />
                            )}
                        </IconButton>
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.55)', minWidth: 18, fontWeight: 600, userSelect: 'none' }}
                        >
                            {Number(likeCount) >= 0 ? Number(likeCount) : 0}
                        </Typography>
                    </Box>
                </Tooltip>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setCommentOpen(true);
                    }}
                    sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.1)' } }}
                >
                    <CommentIcon fontSize="small" />
                </IconButton>
                <Tooltip title={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}>
                    <IconButton
                        size="small"
                        disabled={saveSubmitting}
                        onClick={handleSaveClick}
                        sx={{
                            color: isSaved ? PURPLE : 'rgba(255,255,255,0.6)',
                            '&:hover': { color: PURPLE, bgcolor: 'rgba(157,110,237,0.12)' },
                        }}
                    >
                        {saveSubmitting ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : isSaved ? (
                            <BookmarkIcon fontSize="small" />
                        ) : (
                            <BookmarkBorderIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
                <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.1)' } }}><SendIcon fontSize="small" /></IconButton>
                <IconButton
                    size="small"
                    onClick={handleShareClick}
                    disabled={shareSubmitting}
                    sx={{ color: 'rgba(255,255,255,0.6)', ml: 'auto', '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.1)' } }}
                >
                    {shareSubmitting ? <CircularProgress size={16} color="inherit" /> : <ShareIcon fontSize="small" />}
                </IconButton>
            </Box>

            <CommentModal
                open={commentOpen}
                onClose={() => setCommentOpen(false)}
                listingId={id}
                listingTitle={listing?.title}
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
