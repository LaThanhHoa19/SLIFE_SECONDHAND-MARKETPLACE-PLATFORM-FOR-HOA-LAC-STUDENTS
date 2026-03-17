import { useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import StorefrontIcon from '@mui/icons-material/Storefront';

export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';
export const RED = '#FF4757';

export default function ListingImageGallery({ 
  images, title, listingId, onShare, onReport, isSaved, onToggleSave,
  hideThumbs = false // Added back for layout alignment
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const count = images.length;
  const src = count > 0 ? images[activeIdx] : null;

  const prev = () => setActiveIdx((i) => (i - 1 + count) % count);
  const next = () => setActiveIdx((i) => (i + 1) % count);

  return (
    <Box>
      {/* Ảnh chính */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '80%', // Cao hơn một chút
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: '#2A2535',
        }}
      >
        {src ? (
          <Box
            component="img"
            src={src}
            alt={`${title} ${activeIdx + 1}`}
            sx={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'opacity 0.2s',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 56, color: TEXT_SEC, opacity: 0.4 }} />
          </Box>
        )}

        {/* Nút Share + Save + Report góc trên */}
        <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
          <Tooltip title={isSaved ? "Bỏ lưu tin" : "Lưu tin"}>
            <IconButton
              size="small"
              onClick={onToggleSave}
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)', color: isSaved ? RED : '#fff',
                width: 36, height: 36, backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)', transform: 'scale(1.05)' },
              }}
            >
              {isSaved ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Chia sẻ link">
            <IconButton
              size="small"
              onClick={onShare}
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                width: 36, height: 36, backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: PURPLE, transform: 'scale(1.05)' },
              }}
            >
              <ShareIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Báo cáo tin">
            <IconButton
              size="small"
              onClick={onReport}
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                width: 36, height: 36, backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: RED, transform: 'scale(1.05)' },
              }}
            >
              <FlagIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Nút chuyển ảnh – chỉ hiện khi có nhiều hơn 1 ảnh */}
        {count > 1 && (
          <>
            <IconButton
              onClick={prev}
              sx={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={next}
              sx={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
            {/* Số ảnh indicator */}
            <Box
              sx={{
                position: 'absolute', bottom: 10, right: 12,
                bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '20px',
                px: 1.2, py: 0.3,
              }}
            >
              <Typography fontSize={11} color="rgba(255,255,255,0.9)">
                {activeIdx + 1}/{count}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Thumbnails */}
      {count > 1 && !hideThumbs && (
        <Box
          sx={{
            display: 'flex', gap: 1, mt: 1.5,
            overflowX: 'auto', pb: 0.5,
            '::-webkit-scrollbar': { height: 4 },
            '::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 },
          }}
        >
          {images.map((img, i) => (
            <Box
              key={i}
              onClick={() => setActiveIdx(i)}
              sx={{
                flexShrink: 0,
                width: 64, height: 64,
                borderRadius: '8px',
                overflow: 'hidden',
                border: `2px solid ${i === activeIdx ? PURPLE : BORDER}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: PURPLE },
              }}
            >
              <Box
                component="img"
                src={img}
                alt={`thumb-${i}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
