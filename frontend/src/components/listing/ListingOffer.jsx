import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import OfferModal from './OfferModal';
import * as offerApi from '../../api/offerApi';

const CARD_BG = '#201D26';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';

export default function ListingOffer({ listing, onNotify }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('Để cho mình giá này nhé sếp!');
  const [loading, setLoading] = useState(false);

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
        onClick={() => setOpen(true)}
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
