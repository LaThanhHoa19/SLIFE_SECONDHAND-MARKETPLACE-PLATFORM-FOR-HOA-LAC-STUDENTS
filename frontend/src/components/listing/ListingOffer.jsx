import { Box, Button, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import OfferModal from './OfferModal';
import * as offerApi from '../../api/offerApi';
import { useAuth } from '../../hooks/useAuth';

const CARD_BG = '#201D26';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';

export default function ListingOffer({ listing, onNotify }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('Để cho mình giá này nhé sếp!');
  const [loading, setLoading] = useState(false);

  // Tự động mở popup nếu quay lại từ trang đăng nhập
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'makeOffer' && isAuthenticated) {
      setOpen(true);
      // Xóa action khỏi URL để tránh mở lại khi load trang
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [isAuthenticated]);

  const handleOpen = () => {
    if (!isAuthenticated) {
      const redirectUrl = encodeURIComponent(`${window.location.pathname}?action=makeOffer`);
      onNotify?.(
        'Bạn cần đăng nhập để thực hiện trả giá.', 
        'warning',
        <Button 
          variant="contained"
          size="small" 
          sx={{ 
            fontWeight: 700, 
            textTransform: 'none', 
            ml: 2,
            bgcolor: '#fff',
            color: '#000',
            borderRadius: '20px',
            px: 2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
          }}
          onClick={() => window.location.href = `/login?redirect=${redirectUrl}`}
        >
          Đăng nhập
        </Button>
      );
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    const numericPrice = Number(price);
    const originalPrice = listing?.price || 0;

    if (!numericPrice || numericPrice <= 0 || numericPrice >= originalPrice) {
      onNotify?.('Giá đề xuất không hợp lệ.', 'error');
      return;
    }

    setLoading(true);
    try {
      await offerApi.createListingOffer(listing.id, { price: numericPrice, message });
      onNotify?.('Đã gửi giá đề xuất thành công!', 'success');
      setOpen(false);
    } catch (err) {
      onNotify?.(err?.response?.data?.message || 'Không thể gửi yêu cầu trả giá.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 2, mt: 1 }}>
      <Typography fontSize={13} fontWeight={600} color={TEXT_SEC} sx={{ mb: 1.5 }}>
        Deal giá
      </Typography>

      <Button
        fullWidth
        onClick={handleOpen}
        startIcon={<LocalOfferOutlinedIcon />}
        sx={{
          height: 48, bgcolor: `${PURPLE}15`, color: PURPLE, border: `1px solid ${PURPLE}33`,
          borderRadius: '12px', fontWeight: 700, textTransform: 'none',
          '&:hover': { bgcolor: PURPLE, color: '#fff', boxShadow: '0 8px 16px rgba(157, 110, 237, 0.2)' },
        }}
      >
        Trả giá ngay
      </Button>

      <OfferModal
        open={open}
        onClose={() => setOpen(false)}
        loading={loading}
        listing={listing}
        price={price}
        onPriceChange={setPrice}
        message={message}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
