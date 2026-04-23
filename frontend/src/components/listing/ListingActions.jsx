import { Box, Button, Typography, Tooltip } from '@mui/material';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

export const CARD_BG = '#201D26';
export const CARD_BG2 = '#252230';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const PURPLE = '#9D6EED';
export const GREEN = '#2ED573';

export default function ListingActions({
                                           phoneNumber,
                                           showPhoneNumber = true,
                                           isOwnListing = false,
                                           startingChat = false,
                                           handleShowPhone,
                                           handleChat,
                                       }) {
    const canShowRealPhone = Boolean(isOwnListing || (showPhoneNumber && phoneNumber));
    const phoneLabel = canShowRealPhone ? phoneNumber : 'Hiện số điện thoại';
    const tooltipTitle = canShowRealPhone ? 'Gọi ngay' : 'Xem số điện thoại';

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Tooltip title={tooltipTitle}>
                <Button
                    variant="outlined"
                    onClick={handleShowPhone}
                    sx={{
                        py: 1.75,
                        borderRadius: '12px', // Đồng bộ 12px
                        border: `1px solid ${BORDER}`,
                        bgcolor: '#252230',
                        color: TEXT_PRI,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textTransform: 'none',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '&:hover': {
                            bgcolor: 'rgba(157, 110, 237, 0.05)',
                            borderColor: PURPLE,
                            color: PURPLE,
                            transform: 'translateY(-2px)',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                        },
                        '&:active': { transform: 'translateY(0)' }
                    }}
                >
                    <PhoneAndroidIcon sx={{ fontSize: 22, color: canShowRealPhone ? GREEN : 'inherit' }} />
                    <Typography fontSize={14} fontWeight={700} color={canShowRealPhone ? GREEN : TEXT_PRI}>
                        {phoneLabel}
                    </Typography>
                </Button>
            </Tooltip>
            <Tooltip title="Gửi tin nhắn">
                <Box component="span" sx={{ display: 'flex' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleChat}
                        disabled={startingChat}
                        sx={{
                            py: 1.75,
                            borderRadius: '12px',
                            bgcolor: PURPLE,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                            textTransform: 'none',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            '&:hover': {
                                bgcolor: '#835cd4',
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 25px rgba(157, 110, 237, 0.4)`,
                            },
                            '&:active': { transform: 'translateY(0)' },
                            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }
                        }}
                    >
                        <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
                        <Typography fontSize={15} fontWeight={700}>
                            Nhắn tin
                        </Typography>
                    </Button>
                </Box>
            </Tooltip>
        </Box>
    );
}
