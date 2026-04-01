import { Box, Button, Typography, Tooltip } from '@mui/material';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

export const CARD_BG = '#201D26';
export const CARD_BG2 = '#252230';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const PURPLE = '#9D6EED';
export const GREEN = '#2ED573';

export default function ListingActions({ phoneNumber, startingChat, handleShowPhone, handleChat }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <Tooltip title={phoneNumber ? "Gọi ngay" : "Xem số điện thoại"}>
        <Button
          variant="outlined"
          onClick={handleShowPhone}
          sx={{
            py: 2.5, borderRadius: '14px', border: `1px solid ${BORDER}`, bgcolor: CARD_BG,
            color: TEXT_PRI, display: 'flex', flexDirection: 'column', gap: 1,
            transition: 'all 0.2s',
            '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
          }}
        >
          <PhoneAndroidIcon sx={{ fontSize: 36, color: phoneNumber ? GREEN : 'inherit' }} />
          {phoneNumber ? (
            <Typography fontSize={16} fontWeight={700} color={GREEN}>{phoneNumber}</Typography>
          ) : null}
        </Button>
      </Tooltip>
      <Tooltip title="Gửi tin nhắn">
        <Button
          variant="outlined"
          onClick={handleChat}
          disabled={startingChat}
          sx={{
            py: 2.5, borderRadius: '14px', border: `1px solid ${BORDER}`, bgcolor: CARD_BG,
            color: TEXT_PRI, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
          }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: 36 }} />
        </Button>
      </Tooltip>
    </Box>
  );
}
