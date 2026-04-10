import { useState, useEffect } from 'react';
import { Card, CardActionArea, CardMedia, Typography, Box } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fullImageUrl } from '../../utils/constants';
import { getPurposeInfo, BRAND_COLORS } from '../../utils/listingFormatUtils';

const PURPLE = BRAND_COLORS.PURPLE;

export default function ProfileListingCard({ listing, onClick, viewMode = 'grid' }) {
  const isGrid = viewMode === 'grid';
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  
  const title = listing?.title || 'Không có tên';
  const price = listing?.price ?? listing?.priceDisplay;
  
  // Robust image list derivation
  const rawImages = Array.isArray(listing?.images) ? listing.images : (Array.isArray(listing?.imageUrls) ? listing.imageUrls : []);
  const firstThumb = listing?.thumbnailUrl || listing?.imageUrl;
  const imgList = Array.from(new Set([...(firstThumb ? [firstThumb] : []), ...rawImages])).filter(Boolean);
  const hasMultipleImages = imgList.length > 1;

  // Cycle images every 1s on hover
  useEffect(() => {
    let timer;
    if (isHovered && imgList.length > 1) {
      timer = setInterval(() => {
        setImageIndex((prev) => (prev + 1) % imgList.length);
      }, 1000);
    } else {
      setImageIndex(0);
    }
    return () => clearInterval(timer);
  }, [isHovered, imgList.length]);

  const currentImgPath = imgList[imageIndex] || null;
  const currentImg = currentImgPath ? (currentImgPath.startsWith('http') ? currentImgPath : fullImageUrl(currentImgPath)) : null;

  if (isGrid) {
    return (
      <Card
        elevation={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          borderRadius: 0,
          aspectRatio: '3/4', // Vertical rectangle
          overflow: 'hidden',
          position: 'relative',
          cursor: listing.status === 'SOLD' ? 'default' : 'pointer',
          border: 'none',
          '&:hover .overlay': { opacity: 1 },
        }}
        onClick={() => {
            if (listing.status !== 'SOLD') onClick?.(listing);
        }}
      >
        {currentImg ? (
          <>
            {hasMultipleImages && (
              <Box sx={{ 
                position: 'absolute', 
                top: 10, 
                right: 10, 
                color: 'white', 
                zIndex: 4, 
                filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.6))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <ContentCopyIcon sx={{ fontSize: 18, transform: 'rotate(-5deg)' }} />
              </Box>
            )}
            <CardMedia
              key={imageIndex} // Key forces re-mount or helps with transition triggers
              component="img"
              image={currentImg}
              alt={title}
              sx={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transition: 'opacity 0.5s ease', // Removed transform scale
                animation: isHovered && imgList.length > 1 ? 'fadeIn 0.5s ease' : 'none',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0.8 },
                  '100%': { opacity: 1 }
                }
              }}
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
            bgcolor: 'rgba(0,0,0,0.35)', // Slightly darker to maintain readability with less blur
            backdropFilter: 'blur(1px)', 
            WebkitBackdropFilter: 'blur(1px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 2,
            px: 2,
            color: 'white',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 700, 
              fontSize: '0.9rem',
              lineHeight: 1.3,
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              fontFamily: "'Plus Jakarta Sans', sans-serif", // Ensure san-serif
              // Truncate title
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {listing.status === 'SOLD' ? 'ĐÃ BÁN' : title}
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
        '&:hover': listing.status === 'SOLD' ? {} : {
          bgcolor: 'rgba(157, 110, 237, 0.08)',
          borderColor: PURPLE,
        },
      }}
    >
      <CardActionArea 
        onClick={() => {
            if (listing.status !== 'SOLD') onClick?.(listing);
        }} 
        sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', cursor: listing.status === 'SOLD' ? 'default' : 'pointer' }}
        disableRipple={listing.status === 'SOLD'}
      >
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
          {currentImg ? (
            <CardMedia
              component="img"
              image={currentImg}
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
          {(() => {
            const { color, priceText } = getPurposeInfo(listing?.isGiveaway, price);
            return (
              <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
                {priceText}
              </Typography>
            )
          })()}
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
