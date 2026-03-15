import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';

export const CARD_BG = '#201D26';
export const CARD_BG2 = '#252230';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

export default function ListingOffer({ offerPrice, setOfferPrice, handleOffer }) {
  return (
    <Box
      sx={{
        bgcolor: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        p: 2, mt: 1
      }}
    >
      <Typography fontSize={13} fontWeight={600} color={TEXT_SEC} sx={{ mb: 1.2 }}>
        Deal giá
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleOffer()}
          placeholder="Nhập giá bạn mong muốn"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography fontSize={13} color={TEXT_SEC}>₫</Typography>
              </InputAdornment>
            ),
            sx: { height: 44 } // Same height as button
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: CARD_BG2, borderRadius: '8px', color: TEXT_PRI,
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: PURPLE },
              '&.Mui-focused fieldset': { borderColor: PURPLE },
            },
            '& input::placeholder': { color: TEXT_SEC, opacity: 1 },
          }}
        />
        <Button
          onClick={handleOffer}
          sx={{
            height: 44, // Ensures button is exact same height as the textfield inner
            bgcolor: `${PURPLE}22`, color: PURPLE, border: `1px solid ${PURPLE}44`,
            px: 3, borderRadius: '8px', whiteSpace: 'nowrap', fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(157, 110, 237, 0.15)',
            '&:hover': {
              bgcolor: PURPLE, color: '#fff',
              boxShadow: '0 6px 16px rgba(157, 110, 237, 0.3)',
            },
          }}
        >
          Trả giá
        </Button>
      </Box>
    </Box>
  );
}
