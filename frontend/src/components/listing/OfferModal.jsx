import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toCurrency } from './ListingSummary';

// ─── Shared Theme Constants ──────────────────────────────────────────────────
const CARD_BG = '#201D26';
const CARD_BG2 = '#252230';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_PRI = 'rgba(255,255,255,0.95)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const YELLOW = '#FFD200';

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    borderRadius: '16px',
    color: '#201D26',
    '& fieldset': { borderColor: '#E0E0E0' },
    '&.Mui-focused fieldset': { borderColor: YELLOW },
  },
};

const priceInputStyle = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    borderRadius: '16px',
    color: '#201D26',
    fontSize: 18,
    fontWeight: 700,
    height: 56,
    '& fieldset': { borderColor: '#201D26' },
  },
  '& input': { textAlign: 'center' }
};

export default function OfferModal({
  open,
  onClose,
  loading,
  listing,
  price,
  onPriceChange,
  message,
  onMessageChange,
  onSubmit
}) {
  const originalPrice = listing?.price || 0;
  const images = listing?.images || [];
  const listingImage = images.length > 0 ? images[0] : '';

  const suggestions = [
    { label: '-5%', value: Math.round(originalPrice * 0.95) },
    { label: '-10%', value: Math.round(originalPrice * 0.90) },
    { label: '-15%', value: Math.round(originalPrice * 0.85) },
  ];

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: CARD_BG,
          backgroundImage: 'none',
          borderRadius: '20px',
          border: `1px solid ${BORDER}`,
          color: TEXT_PRI,
          mx: 2 // Margin for small screens
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        fontWeight: 800, 
        fontSize: 18,
        pt: 2, 
        pb: 1,
        position: 'relative' 
      }}>
        Trả giá sản phẩm
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12, color: TEXT_SEC }}
          disabled={loading}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <Divider sx={{ borderColor: BORDER }} />

      <DialogContent sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          {/* Compact Listing Info Summary */}
          <Box sx={{
            display: 'flex', gap: 1.5, p: 1.2, bgcolor: CARD_BG2, borderRadius: '12px',
            borderLeft: `3px solid ${YELLOW}`,
            alignItems: 'center'
          }}>
            <Box component="img" src={listingImage} sx={{ width: 48, height: 48, borderRadius: '8px', objectFit: 'cover' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={600} fontSize={14} noWrap>{listing?.title}</Typography>
              <Typography fontSize={13} fontWeight={700} color={TEXT_SEC}>{toCurrency(originalPrice)}</Typography>
            </Box>
          </Box>

          {/* Message Input - More compact labels */}
          <Box>
            <Typography fontSize={12} fontWeight={700} color={TEXT_SEC} sx={{ mb: 0.8, ml: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Lời nhắn gửi người bán
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={message}
              onChange={(e) => onMessageChange(e.target.value.slice(0, 50))}
              placeholder="Nhập lời nhắn của bạn..."
              sx={inputStyle}
            />
            <Typography textAlign="right" fontSize={10} color={TEXT_SEC} sx={{ mt: 0.4, mr: 0.5 }}>
              {message.length}/50
            </Typography>
          </Box>

          {/* Price & Suggestions Section */}
          <Box>
            <Typography fontSize={12} fontWeight={700} color={TEXT_SEC} sx={{ mb: 0.8, ml: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Giá bạn đề xuất
            </Typography>
            
            <TextField
              fullWidth
              value={price ? Number(price).toLocaleString('vi-VN') : ''}
              onChange={(e) => onPriceChange(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography fontWeight={800} color="#201D26" sx={{ mr: 0.5 }}>đ</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{ ...priceInputStyle, mb: 1.5 }}
            />

            {/* Suggestions in a Single Row */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {suggestions.map((s) => (
                <Button
                  key={s.label}
                  variant="outlined"
                  fullWidth
                  onClick={() => onPriceChange(s.value.toString())}
                  sx={{
                    borderRadius: '10px',
                    color: TEXT_PRI,
                    borderColor: BORDER,
                    textTransform: 'none',
                    py: 1,
                    px: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    lineHeight: 1.2,
                    '&:hover': { 
                      borderColor: YELLOW, 
                      bgcolor: 'rgba(255,210,0,0.08)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Box sx={{ color: YELLOW, fontSize: 10 }}>{s.label}</Box>
                  <Box>{Number(s.value).toLocaleString('vi-VN')}</Box>
                </Button>
              ))}
            </Box>
          </Box>

          {/* Submit Button - More Premium */}
          <Button
            fullWidth
            disabled={loading || !price || Number(price) >= originalPrice}
            onClick={onSubmit}
            sx={{
              bgcolor: YELLOW,
              color: '#000',
              borderRadius: '12px',
              py: 1.5,
              fontSize: 15,
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(255, 210, 0, 0.39)',
              '&:hover': { 
                bgcolor: '#E6BD00',
                boxShadow: '0 6px 20px rgba(255, 210, 0, 0.23)'
              },
              '&.Mui-disabled': { 
                bgcolor: 'rgba(255, 210, 0, 0.2)', 
                color: 'rgba(0, 0, 0, 0.26)' 
              },
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Đang gửi yêu cầu...' : 'Gửi đề xuất'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
