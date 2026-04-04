import { Box, Chip, IconButton, Link, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';
import ChatParticipantAvatar from './ChatParticipantAvatar';

/** Trang hồ sơ đối phương: so khớp buyerId/sellerId với user hiện tại. */
function otherParticipantProfilePath(activeSession, currentUserId) {
    if (!activeSession || currentUserId == null) return null;
    const me = Number(currentUserId);
    const bid = activeSession.buyerId != null ? Number(activeSession.buyerId) : NaN;
    const sid = activeSession.sellerId != null ? Number(activeSession.sellerId) : NaN;
    if (!Number.isFinite(me)) return null;
    let otherId = null;
    if (Number.isFinite(bid) && me === bid && Number.isFinite(sid)) otherId = sid;
    else if (Number.isFinite(sid) && me === sid && Number.isFinite(bid)) otherId = bid;
    if (otherId == null || !Number.isFinite(Number(otherId))) return null;
    const oid = Number(otherId);
    if (oid === me) return '/profile';
    return `/profile/${oid}`;
}

export default function ChatHeader({
                                       theme,
                                       isMdUp,
                                       handleChatMobileBack,
                                       activeSession,
                                       currentUserId,
                                       isSellerInActiveChat,
                                       wsConnected,
                                       onOpenInChatSearch,
                                       showInChatSearch,
                                   }) {
    const listingTitle = activeSession?.listingTitle || '';
    const otherName = activeSession?.otherParticipantName || '';
    const hasListing = Boolean(listingTitle);
    const profileTo = otherParticipantProfilePath(activeSession, currentUserId);
    const profileLabel = `Xem trang cá nhân — ${otherName || 'Người dùng'}`;
    const listingId = activeSession?.listingId != null ? Number(activeSession.listingId) : null;
    const listingTo =
        Number.isFinite(listingId) && listingId > 0 ? `/listings/${listingId}` : null;
    const listingLabel = `Xem chi tiết tin — ${listingTitle || 'Sản phẩm'}`;

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
            {profileTo ? (
                <Link
                    component={RouterLink}
                    to={profileTo}
                    aria-label={profileLabel}
                    title={profileLabel}
                    underline="none"
                    sx={{
                        display: 'inline-flex',
                        borderRadius: '50%',
                        flexShrink: 0,
                        transition: 'opacity 0.15s ease',
                        '&:hover': { opacity: 0.88 },
                        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                    }}
                >
                    <ChatParticipantAvatar
                        avatarUrl={activeSession?.otherParticipantAvatarUrl}
                        displayName={otherName || listingTitle}
                        sx={{ width: 44, height: 44, fontSize: 18 }}
                    />
                </Link>
            ) : (
                <ChatParticipantAvatar
                    avatarUrl={activeSession?.otherParticipantAvatarUrl}
                    displayName={otherName || listingTitle}
                    sx={{ width: 44, height: 44, fontSize: 18 }}
                />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {hasListing ? (
                    <>
                        {listingTo ? (
                            <Link
                                component={RouterLink}
                                to={listingTo}
                                aria-label={listingLabel}
                                title={listingLabel}
                                underline="hover"
                                color="inherit"
                                sx={{
                                    display: 'block',
                                    minWidth: 0,
                                    borderRadius: 1,
                                    '&:focus-visible': {
                                        outline: `2px solid ${theme.palette.primary.main}`,
                                        outlineOffset: 1,
                                    },
                                }}
                            >
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
                            </Link>
                        ) : (
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
                        )}
                        {profileTo ? (
                            <Link
                                component={RouterLink}
                                to={profileTo}
                                aria-label={profileLabel}
                                title={profileLabel}
                                underline="hover"
                                color="inherit"
                                sx={{
                                    display: 'block',
                                    minWidth: 0,
                                    borderRadius: 1,
                                    mt: 0.25,
                                    '&:focus-visible': {
                                        outline: `2px solid ${theme.palette.primary.main}`,
                                        outlineOffset: 1,
                                    },
                                }}
                            >
                                <Typography
                                    component="div"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 500,
                                        lineHeight: 1.35,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {otherName || 'Người dùng'}
                                </Typography>
                            </Link>
                        ) : (
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
                        )}
                    </>
                ) : profileTo ? (
                    <Link
                        component={RouterLink}
                        to={profileTo}
                        aria-label={profileLabel}
                        title={profileLabel}
                        underline="hover"
                        color="inherit"
                        sx={{
                            display: 'block',
                            minWidth: 0,
                            borderRadius: 1,
                            '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                            {otherName || 'Chat'}
                        </Typography>
                    </Link>
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

