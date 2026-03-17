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
  isSold = false
}) {
  return (
    <Box>
      {isMe && !isSold && (
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          sx={{
            mb: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: PURPLE,
            boxShadow: '0 4px 12px rgba(157, 110, 237, 0.3)',
            '&:hover': { bgcolor: '#835cd4' },
          }}
          onClick={onNavigateNew}
        >
          Đăng tin mới
        </Button>
      )}

      {listings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fill, minmax(180px, 1fr))' },
              gap: 2,
            }}
          >
            {listings.map((item) => (
              <ProfileListingCard
                key={item.id}
                listing={isSold ? { ...item, status: 'SOLD' } : item}
                onClick={onNavigateDetail}
              />
            ))}
          </Box>
          {listings.length >= 5 && (
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
