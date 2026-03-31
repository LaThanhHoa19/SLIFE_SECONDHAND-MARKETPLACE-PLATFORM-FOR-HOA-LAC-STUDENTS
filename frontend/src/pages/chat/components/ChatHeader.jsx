import { Avatar, Box, Chip, IconButton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ChatHeader({
                                       theme,
                                       isMdUp,
                                       handleChatMobileBack,
                                       activeSession,
                                       isSellerInActiveChat,
                                       wsConnected,
                                   }) {
    return (
        <Box
            sx={{
                px: { xs: 0.5, sm: 2 },
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 0.98),
            }}
        >
            {!isMdUp ? (
                <IconButton size="small" aria-label="Danh sách hội thoại" onClick={handleChatMobileBack}>
                    <ArrowBackIcon />
                </IconButton>
            ) : null}
            <Avatar
                sx={{
                    width: 44,
                    height: 44,
                    bgcolor: 'primary.main',
                    fontSize: 18,
                }}
            >
                {(activeSession?.otherParticipantName || activeSession?.listingTitle || 'C')[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {activeSession?.otherParticipantName || activeSession?.listingTitle || 'Chat'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {isSellerInActiveChat
                        ? 'Bạn đang chat với người quan tâm tin của bạn'
                        : 'Nhắn trực tiếp với người bán — an toàn hơn khi giao dịch trong app'}
                </Typography>
            </Box>
            {wsConnected && (
                <Chip
                    size="small"
                    label="Đang nhắn tin"
                    color="success"
                    variant="outlined"
                    sx={{
                        height: 26,
                        borderColor: alpha(theme.palette.success.main, 0.55),
                        color: 'success.light',
                    }}
                />
            )}
        </Box>
    );
}

