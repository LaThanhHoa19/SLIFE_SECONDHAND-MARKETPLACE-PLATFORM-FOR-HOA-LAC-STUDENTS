import { Box, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MiniListingCard from './MiniListingCard';

export const CARD_BG = '#201D26';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

export default function ListingSimilar({ similarListings, loadingRelated }) {
  const navigate = useNavigate();

  const displayListings = Array.isArray(similarListings) ? similarListings : [];

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography fontSize={15} fontWeight={700} color={TEXT_PRI}>
          Tin đăng tương tự
        </Typography>
        <Typography
          fontSize={13}
          fontWeight={600}
          color={PURPLE}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              color: '#B289FF',
              textDecoration: 'underline'
            }
          }}
          onClick={() => navigate('/feed')}
        >
          Xem thêm
        </Typography>
      </Box>
      {loadingRelated ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        }}>
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} variant="rectangular" height={200}
              sx={{ bgcolor: '#2A2535', borderRadius: '12px' }} />
          ))}
        </Box>
      ) : displayListings.length === 0 ? (
        <Box
          sx={{
            bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px',
            p: 3, textAlign: 'center',
          }}
        >
          <Typography fontSize={13} color={TEXT_SEC}>Chưa có tin tương tự.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 1.5,
          }}
        >
          {displayListings.map((l) => (
            <MiniListingCard key={l.id ?? l.listingId} listing={l} />
          ))}
        </Box>
      )}
    </Box>
  );
}
