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
    <Card sx={{ overflow: 'hidden' }}>
      <CardActionArea onClick={handleClick}>
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
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {listing?.title || '—'}
          </Typography>
          {showPrice && (
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              {isGiveaway ? 'Cho tặng' : price != null ? `${Number(price).toLocaleString('vi-VN')} ₫` : '—'}
            </Typography>
          )}
          {showStatus && listing?.status && (
            <Typography variant="caption" color="text.secondary">{listing.status}</Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
