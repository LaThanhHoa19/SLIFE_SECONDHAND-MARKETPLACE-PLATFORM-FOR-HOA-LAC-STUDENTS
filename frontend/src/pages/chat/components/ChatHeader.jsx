import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ChatParticipantAvatar from './ChatParticipantAvatar';

export default function ChatHeader({
                                       theme,
                                       isMdUp,
                                       handleChatMobileBack,
                                       activeSession,
                                       isSellerInActiveChat,
                                       wsConnected,
                                       onOpenInChatSearch,
                                       showInChatSearch,
                                   }) {
    const listingTitle = activeSession?.listingTitle || '';
    const otherName = activeSession?.otherParticipantName || '';
    const hasListing = Boolean(listingTitle);

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
            <ChatParticipantAvatar
                avatarUrl={activeSession?.otherParticipantAvatarUrl}
                displayName={otherName || listingTitle}
                sx={{ width: 44, height: 44, fontSize: 18 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {hasListing ? (
                    <>
                        <Typography
                            component="div"
                            variant="subtitle2"
                            sx={{
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'primary.main',
                                lineHeight: 1.35,
                                fontSize: '0.8rem',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word',
                            }}
                        >
                            {listingTitle}
                        </Typography>
                        <Typography
                            component="div"
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                fontWeight: 500,
                                lineHeight: 1.35,
                                mt: 0.25,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {otherName || 'Người dùng'}
                        </Typography>
                    </>
                ) : (
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {otherName || 'Chat'}
                    </Typography>
                )}
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {isSellerInActiveChat
                        ? 'Bạn đang chat với người quan tâm tin của bạn'
                        : 'Nhắn trực tiếp với người bán — an toàn hơn khi giao dịch trong app'}
                </Typography>
            </Box>
            {showInChatSearch && (
                <Tooltip title="Tìm trong cuộc trò chuyện">
                    <IconButton
                        size="small"
                        aria-label="Tìm trong cuộc trò chuyện"
                        onClick={() => onOpenInChatSearch?.()}
                    >
                        <SearchIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
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

