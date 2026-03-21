import { useNavigate } from 'react-router-dom';
import { Box, Card, IconButton, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { fullImageUrl } from '../../utils/constants';

export const CARD_BG = '#201D26';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const RED = '#FF4757';

export const toCurrency = (value) =>
  value == null ? '—' : `${Number(value).toLocaleString('vi-VN')} ₫`;

const parseImages = (imagesData) => {
  if (Array.isArray(imagesData)) return imagesData;
  if (typeof imagesData === 'string') {
    if (imagesData.startsWith('[')) {
      try {
        const parsed = JSON.parse(imagesData);
        if (Array.isArray(parsed)) return parsed;
      } catch { }
    }
    return imagesData.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export default function MiniListingCard({ listing }) {
  const navigate = useNavigate();
  const id = listing?.id ?? listing?.listingId;
  const images = parseImages(listing?.images);
  const firstImage = images[0];
  const urlString = typeof firstImage === 'string' ? firstImage : firstImage?.imageUrl || firstImage?.url;
  const thumbSrc = urlString ? fullImageUrl(urlString) : (listing?.thumbnailUrl ? fullImageUrl(listing.thumbnailUrl) : null);

  return (
    <Card
      onClick={() => id && navigate(`/listings/${id}`)}
      sx={{
        bgcolor: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.18s, box-shadow 0.18s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        },
      }}
    >
      <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: '#2A2535' }}>
        {thumbSrc ? (
          <Box
            component="img"
            src={thumbSrc}
            alt={listing?.title}
            sx={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 32, color: TEXT_SEC, opacity: 0.5 }} />
          </Box>
        )}
        <IconButton
          size="small"
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'absolute', top: 6, right: 6,
            bgcolor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.7)',
            width: 28, height: 28,
            '&:hover': { bgcolor: 'rgba(255,71,87,0.8)', color: '#fff' },
          }}
        >
          <FavoriteBorderIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      <Box sx={{ p: 1.2 }}>
        <Typography
          fontSize={13}
          fontWeight={500}
          color={TEXT_PRI}
          sx={{
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            lineHeight: 1.35, mb: 0.5,
          }}
        >
          {listing?.title || 'Không có tiêu đề'}
        </Typography>
        <Typography fontSize={13} fontWeight={700} color={RED}>
          {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
        </Typography>
      </Box>
    </Card>
  );
}
