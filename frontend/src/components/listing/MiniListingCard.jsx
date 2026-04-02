import { useNavigate } from 'react-router-dom';
import { Box, Card, IconButton, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { fullImageUrl } from '../../utils/constants';

export const CARD_BG = '#201D26';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const RED = '#FF4757';

export const toCurrency = (value) =>
  value == null ? '—' : `${Number(value).toLocaleString('vi-VN')} ₫`;

export default function MiniListingCard({ listing, compact = false, onToggleSave, saveDisabled = false }) {
  const navigate = useNavigate();
  const id = listing?.id ?? listing?.listingId;
  const isSaved = !!(listing?.isSaved ?? listing?.saved);

  // Handle various image field formats from backend.
  const rawImages =
    listing?.images ??
    listing?.thumbnailUrl ??
    listing?.thumbnail_url ??
    listing?.imageUrl ??
    listing?.image_url ??
    listing?.image ??
    listing?.listingImages ??
    listing?.mainImage ??
    null;

  let thumbSrc = null;
  const processUrl = (u) => {
    if (!u || typeof u !== 'string') return null;
    if (u.startsWith('http')) return u;
    return fullImageUrl(u);
  };

  if (Array.isArray(rawImages) && rawImages.length > 0) {
    const first = rawImages[0];
    const urlStr = typeof first === 'string' ? first : (first?.url ?? first?.imageUrl ?? first?.path ?? first?.image_url);
    thumbSrc = processUrl(urlStr);
  } else if (typeof rawImages === 'string' && rawImages.trim().length > 0) {
    try {
      // Check if it's a JSON stringified array
      if (rawImages.startsWith('[') && rawImages.endsWith(']')) {
        const parsed = JSON.parse(rawImages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          thumbSrc = processUrl(parsed[0]);
        }
      } else {
        const firstImg = rawImages.split(',')[0].trim();
        thumbSrc = processUrl(firstImg);
      }
    } catch {
      thumbSrc = processUrl(rawImages.trim());
    }
  }

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
          transform: compact ? 'translateY(-1.5px)' : 'translateY(-3px)',
          boxShadow: compact ? '0 4px 12px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.35)',
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
          onClick={(e) => {
            e.stopPropagation();
            if (!saveDisabled && typeof onToggleSave === 'function') {
              onToggleSave(listing);
            }
          }}
          disabled={saveDisabled}
          sx={{
            position: 'absolute', top: 6, right: 6,
            bgcolor: 'rgba(0,0,0,0.45)', color: isSaved ? RED : 'rgba(255,255,255,0.7)',
            width: 28, height: 28,
            '&:hover': { bgcolor: 'rgba(255,71,87,0.8)', color: '#fff' },
          }}
        >
          {isSaved ? <FavoriteIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Box>

      <Box sx={{ p: 1.2 }}>
        <Box sx={{ overflow: 'hidden', position: 'relative', mb: 0.5, height: '22px' }}>
          <Typography
            fontSize={13}
            fontWeight={700}
            color={TEXT_PRI}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
              transition: 'all 0.3s ease',
              '&:hover': {
                display: 'block',
                whiteSpace: 'nowrap',
                width: 'fit-content',
                animation: 'marquee 5s linear infinite',
                paddingRight: '50px'
              },
              '@keyframes marquee': {
                '0%': { transform: 'translateX(0)' },
                '100%': { transform: 'translateX(-50%)' }
              }
            }}
          >
            {listing?.title || listing?.name || 'Không có tiêu đề'}
          </Typography>
        </Box>
        <Typography fontSize={13} fontWeight={700} color={RED}>
          {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
        </Typography>
      </Box>
    </Card>
  );
}
