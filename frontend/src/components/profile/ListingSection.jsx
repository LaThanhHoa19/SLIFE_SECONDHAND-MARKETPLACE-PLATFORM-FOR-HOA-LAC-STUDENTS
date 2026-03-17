import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProfileListingCard from './ProfileListingCard';

const PAGE_BG = '#1C1B23';
const CARD_BG = '#201D26';
const BORDER = 'rgba(255, 255, 255, 0.07)';
const TEXT_PRI = 'rgba(255, 255, 255, 0.95)';
const TEXT_SEC = 'rgba(255, 255, 255, 0.55)';
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
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: PURPLE,
            px: 3,
            py: 1.2,
            color: '#fff',
            boxShadow: '0 8px 20px rgba(157, 110, 237, 0.2)',
            '&:hover': { bgcolor: '#835cd4', boxShadow: '0 10px 25px rgba(157, 110, 237, 0.3)' },
          }}
          onClick={onNavigateNew}
        >
          Đăng tin mới
        </Button>
      )}

      {listings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography color={TEXT_SEC} fontWeight={500}>{emptyMessage}</Typography>
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
                  px: 5,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: 'rgba(157, 110, 237, 0.3)',
                  color: PURPLE,
                  borderWidth: 1.5,
                  '&:hover': { borderColor: PURPLE, bgcolor: 'rgba(157, 110, 237, 0.08)', borderWidth: 1.5 }
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
