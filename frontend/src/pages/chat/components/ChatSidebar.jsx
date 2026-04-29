import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { SearchHighlight } from '../chatSearchHighlight';
import ChatParticipantAvatar from './ChatParticipantAvatar';

export default function ChatSidebar({
                                        theme,
                                        listDisplay,
                                        sessionsLoading,
                                        sessions,
                                        sessionsTotalElements = 0,
                                        sidebarSearch = '',
                                        onSidebarSearchChange,
                                        /** Chuỗi đã debounce — tô vàng trên dòng tiêu đề (tin / tên), khớp lọc API */
                                        highlightSearchQuery = '',
                                        activeSessionId,
                                        setActiveSessionId,
                                        navigate,
                                        formatSessionTimeShort,
                                        listingUnavailableByListingId = {},
                                    }) {
    const hasSearch = Boolean(String(sidebarSearch || '').trim());

    return (
        <Paper
            elevation={0}
            sx={{
                width: { xs: '100%', md: 336 },
                maxWidth: { xs: '100%', md: 336 },
                flexShrink: 0,
                alignSelf: 'stretch',
                minHeight: 0,
                maxHeight: '100%',
                display: listDisplay,
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: { xs: 0, md: 3 },
                borderRight: { md: 1 },
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.82 : 0.95),
                backdropFilter: 'blur(10px)',
                m: { xs: 0, md: 1.25 },
            }}
        >
            <Box
                sx={{
                    px: 1,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <IconButton size="small" aria-label="Về bảng tin" onClick={() => navigate('/feed')}>
                    <ArrowBackIcon />
                </IconButton>
                <ChatBubbleOutlineIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>
                    Tin nhắn
                </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.75, display: 'block' }}>
                Trao đổi nhanh — gửi ảnh, trả giá, hẹn xem hàng.
            </Typography>
            <Box sx={{ px: 1.5, pb: 1 }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Tìm theo tiêu đề tin hoặc tên…"
                    value={sidebarSearch}
                    onChange={(e) => onSidebarSearchChange?.(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.action.hover, 0.06),
                        },
                    }}
                />
            </Box>
            <Divider />
            {sessionsLoading ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <List
                    dense
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        pt: 0,
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${alpha(theme.palette.primary.main, 0.42)} ${alpha(theme.palette.common.white, 0.06)}`,
                        '&::-webkit-scrollbar': {
                            width: 9,
                        },
                        '&::-webkit-scrollbar-track': {
                            background: alpha(theme.palette.common.white, 0.04),
                            borderRadius: 999,
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: alpha(theme.palette.primary.main, 0.46),
                            borderRadius: 999,
                            border: `2px solid ${alpha(theme.palette.background.paper, 0.75)}`,
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: alpha(theme.palette.primary.light, 0.62),
                        },
                    }}
                >
                    {!hasSearch && sessions.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                            Chưa có hội thoại. Vào tin đăng và bấm &quot;Nhắn tin&quot; để bắt đầu.
                        </Typography>
                    )}
                    {hasSearch && sessions.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                            Không có hội thoại khớp. Thử tìm theo tiêu đề tin hoặc tên người trong chat.
                        </Typography>
                    )}
                    {sessions.length > 0 && hasSearch && sessionsTotalElements > sessions.length && (
                        <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 0.5, display: 'block' }}>
                            Hiển thị {sessions.length}/{sessionsTotalElements} — thu hẹp từ khóa để lọc chính xác hơn.
                        </Typography>
                    )}
                    {sessions.map((s) => {
                        const listingTitle = s.listingTitle || '';
                        const otherName = s.otherParticipantName || '';
                        const hasListing = Boolean(listingTitle);
                        const rowKey = s.sessionId || `row-${s.listingId}-${otherName}`;
                        const unreadCountRaw =
                            s.unreadCount ?? s.unread_count ?? s.unreadMessages ?? s.unread_messages ?? 0;
                        const unreadCount = Number(unreadCountRaw) || 0;
                        const unread = unreadCount > 0;
                        const lid = s.listingId != null ? Number(s.listingId) : NaN;
                        const listingGone =
                            Number.isFinite(lid) && lid > 0 && Boolean(listingUnavailableByListingId[lid]);

                        console.log('[ChatSidebar] session debug', {
                            sessionId: s.sessionId,
                            unreadCount,
                            lastMessagePreview: s.lastMessagePreview,
                            selected: s.sessionId === activeSessionId,
                        });

                        const unreadLabel = unreadCount > 99 ? '99+' : unreadCount;
                        const titleBlock = hasListing ? (
                            <Box sx={{ minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, minWidth: 0 }}>
                                    <SearchHighlight
                                        text={listingTitle}
                                        query={highlightSearchQuery}
                                        component="div"
                                        sx={{
                                            fontWeight: unread ? 900 : 700,
                                            fontSize: '0.78rem',
                                            lineHeight: 1.35,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            color: listingGone ? 'text.disabled' : 'primary.main',
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            wordBreak: 'break-word',
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    />

                                </Box>
                                {listingGone && (
                                    <Chip
                                        size="small"
                                        label="Tin không còn trên chợ"
                                        sx={{
                                            mt: 0.35,
                                            height: 20,
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            color: 'warning.light',
                                            borderColor: alpha(theme.palette.warning.main, 0.45),
                                            bgcolor: alpha(theme.palette.warning.main, 0.08),
                                        }}
                                        variant="outlined"
                                    />
                                )}
                                <SearchHighlight
                                    text={otherName || 'Người dùng'}
                                    query={highlightSearchQuery}
                                    component="div"
                                    sx={{
                                        fontWeight: unread ? 700 : 500,
                                        fontSize: '0.82rem',
                                        lineHeight: 1.4,
                                        color: unread ? 'text.primary' : 'text.secondary',
                                        mt: 0.35,
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        wordBreak: 'break-word',
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, minWidth: 0 }}>
                                <SearchHighlight
                                    text={otherName || 'Chat'}
                                    query={highlightSearchQuery}
                                    component="div"
                                    sx={{
                                        fontWeight: unread ? 800 : 600,
                                        fontSize: '0.88rem',
                                        lineHeight: 1.35,
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        wordBreak: 'break-word',
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                />
                                {unread && (
                                    <Chip
                                        size="small"
                                        label={unreadLabel}
                                        sx={{
                                            height: 20,
                                            px: 0.3,
                                            fontSize: '0.68rem',
                                            fontWeight: 800,
                                            color: '#fff',
                                            bgcolor: 'primary.main',
                                            border: '1px solid',
                                            borderColor: alpha(theme.palette.common.white, 0.18),
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                            </Box>
                        );

                        return (
                            <ListItemButton
                                key={rowKey}
                                selected={s.sessionId === activeSessionId}
                                onClick={() => s.sessionId && setActiveSessionId(s.sessionId)}
                                disabled={!s.sessionId}
                                sx={{
                                    py: 1.1,
                                    alignItems: 'flex-start',
                                    borderRadius: 2.25,
                                    mx: 0.75,
                                    mb: 0.4,
                                    border: '1px solid',
                                    borderColor:
                                        s.sessionId === activeSessionId
                                            ? alpha(theme.palette.primary.main, 0.45)
                                            : 'transparent',
                                    bgcolor:
                                        s.sessionId === activeSessionId
                                            ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.1)
                                            : 'transparent',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
                                    },
                                }}
                            >
                                <ChatParticipantAvatar
                                    avatarUrl={s.otherParticipantAvatarUrl}
                                    displayName={otherName || listingTitle}
                                    sx={{ width: 44, height: 44, mr: 1.5, fontSize: 16 }}
                                />
                                <ListItemText
                                    primary={titleBlock}
                                    primaryTypographyProps={{ component: 'div' }}
                                    secondary={
                                        <Typography
                                            component="div"
                                            noWrap
                                            sx={{
                                                fontSize: '0.75rem',
                                                fontWeight: unread ? 700 : 400,
                                                color: unread ? 'text.primary' : 'text.secondary',
                                            }}
                                        >
                                            {s.lastMessagePreview || 'Chưa có tin nhắn'}
                                        </Typography>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                    sx={{ mr: 0.5, minWidth: 0 }}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                        {formatSessionTimeShort(s.lastMessageAt)}
                                    </Typography>
                                    {unread && (
                                        <Box
                                            sx={{
                                                mt: 0.6,
                                                minWidth: 20,
                                                height: 20,
                                                px: unreadCount > 9 ? 0.7 : 0,
                                                borderRadius: 999,
                                                bgcolor: 'primary.main',
                                                color: '#fff',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 11,
                                                fontWeight: 800,
                                                lineHeight: 1,
                                                boxShadow: `0 0 0 2px ${alpha(theme.palette.background.paper, 0.9)}`,
                                            }}
                                        >
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Box>
                                    )}
                                </Box>
                            </ListItemButton>
                        )})}
                </List>
            )}
        </Paper>
    );
}
