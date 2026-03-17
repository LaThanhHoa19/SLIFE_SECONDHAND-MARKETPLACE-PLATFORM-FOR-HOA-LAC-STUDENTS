import { useRef, useState, useEffect } from 'react';
import { Box, Card, Skeleton, Typography, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MiniListingCard from './MiniListingCard';

export const CARD_BG = '#201D26';
export const CARD_BG2 = '#252230';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

const MOCK_SELLER_LISTINGS = [
  {
    id: 'm1',
    title: 'Balo laptop siêu bền',
    price: 150000,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80'],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'm2',
    title: 'Bàn phím cơ DareU',
    price: 350000,
    images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'm3',
    title: 'Giáo trình Giải tích 1',
    price: 30000,
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'm4',
    title: 'Áo lớp chuyên Toán',
    isGiveaway: true,
    price: 0,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'm5',
    title: 'Tai nghe Sony WH-1000XM4',
    price: 2500000,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];

export default function ListingSellerOtherListings({ sellerListings, loadingRelated, seller, listing }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const displayListings = sellerListings?.length > 0 ? sellerListings : MOCK_SELLER_LISTINGS;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 10);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [displayListings]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <Card
      sx={{
        bgcolor: CARD_BG, border: `1px solid ${BORDER}`,
        borderRadius: '14px', p: 1, // Compact padding
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        height: 'fit-content' // Eliminate empty purple space
      }}
    >
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography fontSize={15} fontWeight={700} color={TEXT_PRI}>
          Tin rao khác của{' '}
          <Box
            component="span"
            sx={{
              color: PURPLE,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => {
              const sid = seller?.id ?? seller?.userId ?? listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id;
              if (sid) navigate(`/profile/${sid}`);
            }}
          >
            {seller?.fullName || 'người bán'}
          </Box>
        </Typography>
        <Typography
          fontSize={13}
          fontWeight={600}
          color={PURPLE}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { color: '#B289FF', textDecoration: 'underline' }
          }}
          onClick={() => {
            const sid = seller?.id ?? seller?.userId ?? listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id;
            if (sid) navigate(`/profile/${sid}`);
          }}
        >
          Xem tất cả
        </Typography>
      </Box>

      {loadingRelated ? (
        <Box sx={{ display: 'flex', gap: 1.2, overflowX: 'auto' }}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rectangular" width={120} height={150}
              sx={{ bgcolor: '#2A2535', borderRadius: '10px', flexShrink: 0 }} />
          ))}
        </Box>
      ) : displayListings.length === 0 ? (
        <Box
          sx={{
            bgcolor: CARD_BG2, borderRadius: '10px',
            p: 2, textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Typography fontSize={13} color={TEXT_SEC}>Chưa có tin đăng nào khác.</Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', mx: -1 }}>
          <Box
            ref={scrollRef}
            onScroll={checkScroll}
            sx={{
              display: 'flex', gap: 1.5,
              overflowX: 'auto', px: 1, pb: 0.5,
              '::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar
              msOverflowStyle: 'none', scrollbarWidth: 'none',
              scrollSnapType: 'x proximity'
            }}
          >
            {displayListings.map((l) => (
              <Box
                key={l.id ?? l.listingId}
                sx={{
                  flexShrink: 0,
                  width: '130px', // Fixed width to create peek effect
                  scrollSnapAlign: 'start'
                }}
              >
                <MiniListingCard listing={l} />
              </Box>
            ))}
          </Box>

          {/* Navigation Arrows - Adjusted positions to be more inset */}
          {showLeft && (
            <IconButton
              size="small"
              onClick={() => scroll('left')}
              sx={{
                position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.8)', color: '#fff', zIndex: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: PURPLE }
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          )}
          {showRight && (
            <IconButton
              size="small"
              onClick={() => scroll('right')}
              sx={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.8)', color: '#fff', zIndex: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: PURPLE }
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
    </Card>
  );
}
