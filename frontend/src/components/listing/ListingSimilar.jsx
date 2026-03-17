import { Box, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MiniListingCard from './MiniListingCard';

export const CARD_BG = '#201D26';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

const MOCK_SIMILAR = [
  {
    id: 's1',
    title: 'Điện thoại iPhone 11 64GB',
    price: 4500000,
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80'],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 's2',
    title: 'Laptop Dell Inspiron 5590',
    price: 8500000,
    images: ['https://images.unsplash.com/photo-1593642702739-c36f91c94d1b?w=500&q=80'],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 's3',
    title: 'Sách IELTS Cambridge 17',
    price: 90000,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80'],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 's4',
    title: 'Vợt cầu lông Yonex',
    price: 650000,
    images: ['https://images.unsplash.com/photo-1622279457486-69d73ce88726?w=500&q=80'],
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export default function ListingSimilar({ similarListings, loadingRelated }) {
  const navigate = useNavigate();

  const displayListings = similarListings?.length > 0 ? similarListings : MOCK_SIMILAR;

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
