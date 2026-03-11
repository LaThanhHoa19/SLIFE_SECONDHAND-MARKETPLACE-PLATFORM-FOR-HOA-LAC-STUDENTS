/** Card hiển thị listing theo layout feed (header + content + media + actions). */
import {
    Avatar,
    Box,
    Card,
    CardContent,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import {
    ChatBubbleOutline as CommentIcon,
    FavoriteBorder as FavoriteIcon,
    MoreHoriz as MoreIcon,
    Send as SendIcon,
    Share as ShareIcon,
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {fullImageUrl} from '../../utils/constants';
import {formatDate} from '../../utils/formatDate';

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
        return pickupAddress.locationName || pickupAddress.addressText || '';
    }

    return '';
};

const getConditionText = (listing) =>
    listing?.itemCondition || listing?.condition || listing?.status || '';


export default function ListingCard({listing, onClick}) {
    const navigate = useNavigate();
    const id = listing?.id ?? listing?.listingId;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const seller = getSeller(listing);
    const contentInsetLeft = '62px';

    const handleClick = () => {
        if (onClick) onClick(listing);
        else if (id) navigate(`/listings/${id}`);
    };

    const conditionText = getConditionText(listing);
    const locationText = getLocationText(listing);

    return (
        <Card sx={{maxWidth: 700, mx: 'auto', width: '100%'}}>
            <Box
                onClick={handleClick}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
                role="button"
                tabIndex={0}
                sx={{cursor: 'pointer', outline: 'none'}}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: '#E2E1E1'
                }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar src={fullImageUrl(seller?.avatarUrl)} alt={seller?.fullName || 'seller'}/>
                        <Box>
                            <Typography fontSize={16} fontWeight={700}>{seller?.fullName || 'Người bán'}</Typography>
                            <Typography fontSize={12}
                                        color="text.secondary">{formatDate(listing?.createdAt) || 'Vừa đăng'}</Typography>
                        </Box>
                    </Stack>
                    <IconButton size="small"><MoreIcon/></IconButton>
                </Box>

                <CardContent sx={{bgcolor: '#E2E1E1', pt: 2, pb: 1, pl: contentInsetLeft, pr: 1.5}}>
                    <Typography fontSize={22} fontWeight={700} color="#444">{listing?.title || 'Không có tiêu đề'}</Typography>
                    <Typography mt={0.5} fontSize={14} color="#222">{listing?.description || listing?.content || ''}</Typography>
                    {!!conditionText && (
                        <Typography mt={1} fontSize={13} fontWeight={700} color="#666">
                            Tình trạng: {conditionText}
                        </Typography>
                    )}
                    {!!locationText && (
                        <Typography mt={0.5} fontSize={13} fontWeight={700} color="#777">
                            Vị trí: {locationText}
                        </Typography>
                    )}
                    <Typography mt={1} fontSize={20} fontWeight={700} color="#E53935">
                        {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
                    </Typography>

                    {!!images.length && (
                        <Box
                            sx={{
                                mt: 1.5,
                                display: 'flex',
                                overflowX: 'auto',
                                scrollSnapType: 'x mandatory',
                                gap: 1,
                                pb: 0.5,
                                '&::-webkit-scrollbar': {height: 6},
                                '&::-webkit-scrollbar-thumb': {backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 999},
                            }}
                        >
                            {images.map((img, index) => (
                                <Box
                                    key={`${img}-${index}`}
                                    component="img"
                                    src={fullImageUrl(img)}
                                    alt={`${listing?.title || 'listing'}-${index + 1}`}
                                    sx={{
                                        width: '100%',
                                        minWidth: '100%',
                                        height: 300,
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        scrollSnapAlign: 'start'
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Box>

            <Box sx={{pl: contentInsetLeft, pr: 1.5, pt: 0, py: 0.5, bgcolor: '#E1E0E0', display: 'flex', gap: 2}}>
                <IconButton size="small"><FavoriteIcon fontSize="small"/></IconButton>
                <IconButton size="small"><SendIcon fontSize="small"/></IconButton>
                <IconButton size="small"><CommentIcon fontSize="small"/></IconButton>
                <IconButton size="small"><ShareIcon fontSize="small"/></IconButton>
            </Box>
        </Card>
    );
}
