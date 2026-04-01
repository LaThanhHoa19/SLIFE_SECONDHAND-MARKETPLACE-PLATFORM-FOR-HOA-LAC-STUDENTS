import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProfileListingCard from './ProfileListingCard';

const PURPLE = '#9D6EED';

export default function ListingSection({
  isMe,
  listings,
  showAll,
  setShowAll,
  onNavigateNew,
  onNavigateDetail,
  emptyMessage,
  isSold = false,
  viewMode = 'grid'
}) {
  const isGrid = viewMode === 'grid';

  return (
    <Box>

      {listings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isGrid 
                ? { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)' } 
                : '1fr',
              gap: '2.5px', // "1 đường chỉ" - made slightly thicker as requested
            }}
          >
            {listings.map((item) => (
              <ProfileListingCard
                key={item.id}
                listing={isSold ? { ...item, status: 'SOLD' } : item}
                onClick={onNavigateDetail}
                viewMode={viewMode}
              />
            ))}
          </Box>
          {listings.length >= 12 && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => setShowAll(!showAll)}
                sx={{
                  borderRadius: 10,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: PURPLE,
                  color: PURPLE,
                  '&:hover': { borderColor: '#835cd4', bgcolor: 'rgba(157, 110, 237, 0.05)' }
                }}
              >
                {showAll ? 'Thu gọn' : 'Xem thêm tin đăng'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
