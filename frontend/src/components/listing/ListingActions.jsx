import { Box, Button, Typography, Tooltip } from '@mui/material';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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
                                           isPhoneRevealed = false,
                                           handleShowPhone,
                                           handleChat,
                                       }) {
    const phoneIsAvailable = Boolean(isOwnListing || showPhoneNumber);
    const phoneButtonInteractive = phoneIsAvailable && !isPhoneRevealed;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {!phoneIsAvailable && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.25,
                        p: 1.5,
                        borderRadius: '14px',
                        border: `1px solid ${BORDER}`,
                        bgcolor: 'rgba(255,255,255,0.03)',
                    }}
                >
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(157, 110, 237, 0.12)',
                            color: PURPLE,
                            flexShrink: 0,
                        }}
                    >
                        <InfoOutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography fontSize={14} fontWeight={700} color={TEXT_PRI} lineHeight={1.35}>
                            Người bán chỉ nhận liên hệ qua chat
                        </Typography>
                        <Typography fontSize={12.5} color="rgba(255,255,255,0.68)" lineHeight={1.45} sx={{ mt: 0.25 }}>
                            Số điện thoại đã được ẩn để bảo mật thông tin liên hệ.
                        </Typography>
                    </Box>
                </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: phoneIsAvailable ? '1fr 1fr' : '1fr', gap: 2 }}>
                {phoneIsAvailable && (
                    phoneButtonInteractive ? (
                        <Tooltip title="Xem số điện thoại">
                            <span>
                                <Button
                                    variant="outlined"
                                    onClick={handleShowPhone}
                                    sx={{
                                        width: '100%',
                                        py: 1.75,
                                        borderRadius: '12px',
                                        border: `1px solid ${BORDER}`,
                                        bgcolor: '#252230',
                                        color: TEXT_PRI,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1.2,
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
                                    <PhoneAndroidIcon sx={{ fontSize: 22, color: GREEN }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                                        <Typography fontSize={13} fontWeight={700} color={TEXT_PRI}>
                                            Xem số điện thoại
                                        </Typography>
                                        <Typography fontSize={12} fontWeight={600} color={GREEN}>
                                            {phoneNumber}
                                        </Typography>
                                    </Box>
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Box
                            sx={{
                                width: '100%',
                                py: 1.75,
                                px: 2,
                                borderRadius: '12px',
                                border: `1px solid ${BORDER}`,
                                bgcolor: '#252230',
                                color: TEXT_PRI,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.2,
                                cursor: 'default',
                                userSelect: 'text',
                            }}
                        >
                            <PhoneAndroidIcon sx={{ fontSize: 22, color: GREEN }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                                <Typography fontSize={13} fontWeight={700} color={TEXT_PRI}>
                                    Số điện thoại
                                </Typography>
                                <Typography fontSize={12} fontWeight={600} color={GREEN}>
                                    {phoneNumber}
                                </Typography>
                            </Box>
                        </Box>
                    )
                )}

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
        </Box>
    );
}
