/**
 * Card tin đăng trên trang profile: ảnh, tên, giá (theo wireframe).
 */
import { Card, CardActionArea, CardMedia, Typography, Box } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CollectionsIcon from '@mui/icons-material/Collections';
import { fullImageUrl } from '../../utils/constants';

function formatPrice(value) {
  if (value == null) return '—';
  const num = Number(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

const PURPLE = '#9D6EED';

export default function ProfileListingCard({ listing, onClick, viewMode = 'grid' }) {
  const isGrid = viewMode === 'grid';
  const title = listing?.title || 'Không có tên';
  const price = listing?.price ?? listing?.priceDisplay;
  const imgList = listing?.images;
  const thumbPath = Array.isArray(imgList) && imgList.length > 0 ? imgList[0] : (listing?.thumbnailUrl || listing?.imageUrl || null);
  const thumb = thumbPath ? (thumbPath.startsWith('http') ? thumbPath : fullImageUrl(thumbPath)) : null;

  if (isGrid) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 0,
          aspectRatio: '1',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          border: 'none',
          '&:hover .overlay': { opacity: 1 },
        }}
        onClick={() => onClick?.(listing)}
      >
        {thumb ? (
          <>
            {(imgList?.length > 1 || (listing?.imageCount && listing.imageCount > 1)) && (
              <Box sx={{ 
                position: 'absolute', 
                top: 10, 
                right: 10, 
                color: 'white', 
                zIndex: 2,
                filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.4))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CollectionsIcon sx={{ fontSize: 22 }} />
              </Box>
            )}
            <CardMedia
              component="img"
              image={thumb}
              alt={title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </>
        ) : (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.1)' }} />
          </Box>
        )}

        {/* Hover Overlay */}
        <Box 
          className="overlay"
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            zIndex: 2,
            gap: 2,
            color: 'white'
          }}
        >
          <Typography variant="body1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {listing.status === 'SOLD' ? 'ĐÃ BÁN' : formatPrice(price)}
          </Typography>
        </Box>
      </Card>
    );
  }

  // List View
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
          bgcolor: 'rgba(157, 110, 237, 0.08)',
          borderColor: PURPLE,
        },
      }}
    >
      <CardActionArea onClick={() => onClick?.(listing)} sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start' }}>
        <Box
          sx={{
            width: 150,
            height: 150,
            flexShrink: 0,
            bgcolor: '#262626',
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
            <ImageIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.1)' }} />
          )}
          {listing.status === 'SOLD' && (
            <Box sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              bgcolor: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}>
              <Typography variant="caption" fontWeight={800} sx={{ color: 'white', px: 1, py: 0.2, border: '1px solid white', borderRadius: 0.5 }}>
                ĐÃ BÁN
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              color: 'white',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1
            }}
          >
            {title}
          </Typography>
          <Typography variant="h6" sx={{ color: PURPLE, fontWeight: 700 }}>
            {listing?.isGiveaway ? 'Cho tặng' : formatPrice(price)}
          </Typography>
          {listing.location && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
              {listing.location}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
