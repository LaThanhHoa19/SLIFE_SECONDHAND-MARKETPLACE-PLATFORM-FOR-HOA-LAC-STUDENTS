/**
 * Card tin đăng trên trang profile: ảnh, tên, giá (theo wireframe).
 */
import { Card, CardActionArea, CardMedia, Typography, Box } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { fullImageUrl } from '../../utils/constants';

function formatPrice(value) {
  if (value == null) return '—';
  const num = Number(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export default function ProfileListingCard({ listing, onClick }) {
  const title = listing?.title || 'Không có tên';
  const price = listing?.price ?? listing?.priceDisplay;
  const imgList = listing?.images;
  const thumbPath = Array.isArray(imgList) && imgList.length > 0 ? imgList[0] : null;
  const thumb = thumbPath ? fullImageUrl(thumbPath) : null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.light',
        },
      }}
    >
      <CardActionArea onClick={() => onClick?.(listing)} sx={{ display: 'block' }}>
        <Box
          sx={{
            aspectRatio: '1',
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {thumb ? (
            <CardMedia
              component="img"
              image={thumb}
              alt={title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
          )}
        </Box>
        <Box sx={{ p: 1.5 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ mt: 0.5 }}>
            {listing?.isGiveaway ? 'Cho tặng' : formatPrice(price)}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
