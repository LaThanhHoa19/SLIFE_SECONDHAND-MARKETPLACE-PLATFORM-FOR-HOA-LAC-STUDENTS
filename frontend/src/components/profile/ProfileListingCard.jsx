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

const PAGE_BG = '#1C1B23';
const CARD_BG = '#201D26';
const BORDER = 'rgba(255, 255, 255, 0.07)';
const TEXT_PRI = 'rgba(255, 255, 255, 0.95)';
const TEXT_SEC = 'rgba(255, 255, 255, 0.55)';
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
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: CARD_BG,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${BORDER}`,
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(157, 110, 237, 0.4)',
          background: '#252230',
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
        <Box sx={{ p: 2 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              color: TEXT_PRI,
              height: '2.8em',
              lineHeight: '1.4em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1
            }}
          >
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: PURPLE, fontWeight: 800, fontSize: '1rem' }}>
            {listing?.isGiveaway ? 'Cho tặng' : formatPrice(price)}
          </Typography>
          {listing.location && (
            <Typography variant="caption" sx={{ color: TEXT_SEC, display: 'block', mt: 0.8, opacity: 0.8 }}>
              {listing.location}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
