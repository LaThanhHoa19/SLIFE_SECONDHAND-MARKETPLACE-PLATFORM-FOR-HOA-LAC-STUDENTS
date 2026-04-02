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
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Tooltip title={phoneNumber ? "Gọi ngay" : "Xem số điện thoại"}>
                <Button
                    variant="outlined"
                    onClick={handleShowPhone}
                    sx={{
                        py: 1.75,
                        borderRadius: '14px',
                        border: `1px solid ${BORDER}`,
                        bgcolor: CARD_BG,
                        color: TEXT_PRI,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        textTransform: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
                    }}
                >
                    <PhoneAndroidIcon sx={{ fontSize: 22, color: phoneNumber ? GREEN : 'inherit' }} />
                    <Box sx={{ textAlign: 'left' }}>
                        <Typography fontSize={13} fontWeight={700} color={'rgba(255,255,255,0.78)'} lineHeight={1.15}>
                            Số điện thoại
                        </Typography>
                        <Typography fontSize={13} fontWeight={800} color={phoneNumber ? GREEN : TEXT_PRI} lineHeight={1.2}>
                            {phoneNumber || 'Hiển thị số'}
                        </Typography>
                    </Box>
                </Button>
            </Tooltip>
            <Tooltip title="Gửi tin nhắn">
                <Button
                    variant="outlined"
                    onClick={handleChat}
                    disabled={startingChat}
                    sx={{
                        py: 1.75,
                        borderRadius: '14px',
                        border: `1px solid ${BORDER}`,
                        bgcolor: CARD_BG,
                        color: TEXT_PRI,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        textTransform: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
                    }}
                >
                    <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
                    <Box sx={{ textAlign: 'left' }}>
                        <Typography fontSize={13} fontWeight={700} color={'rgba(255,255,255,0.78)'} lineHeight={1.15}>
                            Nhắn tin
                        </Typography>
                        <Typography fontSize={13} fontWeight={800} color={TEXT_PRI} lineHeight={1.2}>
                            Bắt đầu chat
                        </Typography>
                    </Box>
                </Button>
            </Tooltip>
        </Box>
    );
}
