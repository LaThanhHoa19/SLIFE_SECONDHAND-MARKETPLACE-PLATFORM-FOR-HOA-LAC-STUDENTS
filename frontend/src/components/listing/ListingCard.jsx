/** Card hiển thị listing (ảnh, tiêu đề, giá). */
/** Card hiển thị listing theo layout feed (header + content + media + actions). */
import {
    Avatar,
    Box,
    Card,
    CardActionArea,
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

export default function ListingCard({listing, onClick}) {
    const navigate = useNavigate();
    const id = listing?.id ?? listing?.listingId;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const seller = listing?.sellerSummary || listing?.seller || {};

    const handleClick = () => {
        if (onClick) onClick(listing);
        else if (id) navigate(`/listings/${id}`);
    };

    return (
        <Card sx={{maxWidth: 700, mx: 'auto', width: '100%'}}>
            <CardActionArea onClick={handleClick}>
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

                <CardContent sx={{bgcolor: '#E2E1E1', pt: 2}}>
                    <Typography fontSize={22} fontWeight={700}
                                color="#444">{listing?.title || 'Không có tiêu đề'}</Typography>
                    <Typography mt={0.5} fontSize={14}
                                color="#222">{listing?.description || 'Không có mô tả.'}</Typography>
                    <Typography mt={1} fontSize={13} fontWeight={700} color="#666">Tình
                        trạng: {listing?.itemCondition || 'Đã qua sử dụng'}</Typography>
                    <Typography mt={0.5} fontSize={13} fontWeight={700} color="#777">Vị
                        trí: {listing?.location || listing?.pickupAddress || 'Hòa Lạc, Thạch Thất, Hà Nội'}</Typography>
                    <Typography mt={1} fontSize={20} fontWeight={700} color="#E53935">
                        {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
                    </Typography>

                    {!!images.length && (
                        <Box sx={{mt: 1.5, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1}}>
                            {images.slice(0, 4).map((img, index) => (
                                <Box
                                    key={`${img}-${index}`}
                                    component="img"
                                    src={fullImageUrl(img)}
                                    alt={`${listing?.title || 'listing'}-${index + 1}`}
                                    sx={{width: '100%', height: 180, objectFit: 'cover', borderRadius: 1}}
                                />
                            ))}
                        </Box>)}
                </CardContent>

                <Box sx={{px: 1.5, py: 0.5, bgcolor: '#E1E0E0', display: 'flex', gap: 2}}>
                    <IconButton size="small"><FavoriteIcon fontSize="small"/></IconButton>
                    <IconButton size="small"><SendIcon fontSize="small"/></IconButton>
                    <IconButton size="small"><CommentIcon fontSize="small"/></IconButton>
                    <IconButton size="small"><ShareIcon fontSize="small"/></IconButton>
                </Box>
            </CardActionArea>
        </Card>
    );
}
