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

const PURPLE = '#9D6EED';

export default function ProfileListingCard({ listing, onClick }) {
  const title = listing?.title || 'Không có tên';
  const price = listing?.price ?? listing?.priceDisplay;
  const imgList = listing?.images;
  const thumbPath = Array.isArray(imgList) && imgList.length > 0 ? imgList[0] : (listing?.imageUrl || null);
  const thumb = thumbPath ? (thumbPath.startsWith('http') ? thumbPath : fullImageUrl(thumbPath)) : null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(157, 110, 237, 0.15)',
          borderColor: PURPLE,
        },
      }}
    >
      <CardActionArea onClick={() => onClick?.(listing)} sx={{ display: 'block' }}>
        <Box
          sx={{
            aspectRatio: '1',
            bgcolor: '#f0f0f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
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
            <ImageIcon sx={{ fontSize: 40, color: 'grey.300' }} />
          )}
          {listing.status === 'SOLD' && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'white', px: 1.5, py: 0.5, border: '2px solid white', borderRadius: 1 }}>
                ĐÃ BÁN
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ p: 1.5 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              color: '#1d1d1f',
              height: '2.8em',
              lineHeight: '1.4em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: PURPLE, fontWeight: 800, fontSize: '0.95rem' }}>
            {listing?.isGiveaway ? 'Cho tặng' : formatPrice(price)}
          </Typography>
          {listing.location && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
              {listing.location}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
