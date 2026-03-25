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
} from '@mui/material';
import {
    ChatBubbleOutline as CommentIcon,
    FavoriteBorder as FavoriteIcon,
    MoreHoriz as MoreIcon,
    Send as SendIcon,
    Share as ShareIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {fullImageUrl} from '../../utils/constants';
import {formatPickupDisplayLine} from '../../utils/addressDisplay';
import {formatDate} from '../../utils/formatDate';
import {useAuth} from '../../hooks/useAuth';
import * as followApi from '../../api/followApi';
import CommentModal from './CommentModal';

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
                                    }) {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const id = listing?.id ?? listing?.listingId;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const seller = getSeller(listing);
    const sellerId = listing?.sellerId ?? seller?.userId ?? seller?.id ?? listing?.seller?.id;
    const isMe = isAuthenticated && user && sellerId && String(user.id) === String(sellerId);
    const [followed, setFollowed] = useState(!!listing?.isFollowed);
    const [followLoading, setFollowLoading] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);

    useEffect(() => {
        setFollowed(!!listing?.isFollowed);
    }, [listing?.id, listing?.isFollowed]);

    const handleClick = () => {
        if (onClick) onClick(listing);
        else if (id) navigate(`/listings/${id}`);
    };

    const handleFollowClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!sellerId || isMe) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setFollowLoading(true);
        try {
            if (followed) {
                await followApi.unfollowUser(sellerId);
                setFollowed(false);
            } else {
                await followApi.followUser(sellerId);
                setFollowed(true);
            }
        } catch {
            /* silent — optional toast at feed level */
        } finally {
            setFollowLoading(false);
        }
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
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
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
            <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#FF4757', bgcolor: 'rgba(255,71,87,0.1)' } }}><FavoriteIcon fontSize="small" /></IconButton>
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
                <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.1)' } }}><SendIcon fontSize="small" /></IconButton>
                <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', ml: 'auto', '&:hover': { color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.1)' } }}><ShareIcon fontSize="small" /></IconButton>
            </Box>

            <CommentModal 
                open={commentOpen} 
                onClose={() => setCommentOpen(false)} 
                listingId={id} 
                listingTitle={listing?.title} 
            />
        </Card>
    );
}
