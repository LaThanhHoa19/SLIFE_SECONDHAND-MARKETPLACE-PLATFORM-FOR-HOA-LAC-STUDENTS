/** Card hiển thị listing (ảnh, tiêu đề, giá). */
import { Card, CardActionArea, CardContent, Typography, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';

export default function ListingCard({ listing, onClick, showPrice = true, showStatus = false }) {
    const navigate = useNavigate();
    const id = listing?.id ?? listing?.listingId;
    const images = listing?.images ?? [];
    const firstImage = images[0] ? fullImageUrl(images[0]) : null;
    const price = listing?.price;
    const isGiveaway = listing?.isGiveaway;

    const handleClick = () => {
        if (onClick) onClick(listing);
        else if (id) navigate(`/listings/${id}`);
    };

    return (
        <Card sx={{
            overflow: 'hidden',
            bgcolor: '#2A2733',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            boxShadow: 'none',
            mb: 1.5,
        }}>
            <CardActionArea onClick={handleClick} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                {firstImage && (
                    <CardMedia
                        component="img"
                        height="160"
                        image={firstImage}
                        alt={listing?.title || ''}
                        sx={{ objectFit: 'cover' }}
                    />
                )}
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ color: '#FFFFFF' }}>
                        {listing?.title || '—'}
                    </Typography>
                    {showPrice && (
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#E879A0' }}>
                            {isGiveaway ? 'Cho tặng' : price != null ? `${Number(price).toLocaleString('vi-VN')} ₫` : '—'}
                        </Typography>
                    )}
                    {showStatus && listing?.status && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{listing.status}</Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
