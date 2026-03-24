import {
    Avatar,
    Badge,
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Popover,
    Typography,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FlagIcon from '@mui/icons-material/Flag';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../../providers/NotificationProvider';
import * as chatApi from '../../api/chatApi';

const formatTime = (createdAt) => {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return d.toLocaleDateString('vi-VN');
};

const getIconForType = (type) => {
    switch (type) {
        case 'MESSAGE':
        case 'COMMENT':
            return <ChatIcon sx={{ fontSize: 18 }} />;
        case 'OFFER':
            return <LocalOfferIcon sx={{ fontSize: 18 }} />;
        case 'REPORT':
            return <FlagIcon sx={{ fontSize: 18 }} />;
        case 'DEAL':
            return <CheckCircleIcon sx={{ fontSize: 18 }} />;
        default:
            return <NotificationsIcon sx={{ fontSize: 18 }} />;
    }
};

const normalizeName = (name) =>
    (name ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        // Bỏ dấu để so khớp tên tiếng Việt ổn định hơn.
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

// notification.content format (BE): "<senderName>: <preview...>"
const parseSenderNameFromNotificationContent = (content) => {
    const s = (content ?? '').trim();
    if (!s) return null;
    const idx = s.indexOf(':');
    if (idx <= 0) return s;
    return s.slice(0, idx).trim() || null;
};

export default function NotificationDropdown({ anchorEl, open, onClose }) {
    const { notifications, unreadCount, markRead, markAllRead } =
        useContext(NotificationContext);
    const navigate = useNavigate();

    const resolveChatSessionIdBySenderName = async (senderName) => {
        if (!senderName) return null;
        try {
            const res = await chatApi.getChats('ALL');
            const body = res?.data;
            const list = Array.isArray(body?.data)
                ? body.data
                : Array.isArray(body?.content)
                ? body.content
                : Array.isArray(body)
                ? body
                : [];
            const target = list.find(
                (s) => normalizeName(s?.otherParticipantName) === normalizeName(senderName)
            );
            return target?.sessionId ?? null;
        } catch (e) {
            console.warn('[NotificationDropdown] resolve chat session failed:', e);
            return null;
        }
    };

    const handleItemClick = async (n) => {
        if (!n.isRead) {
            await markRead(n.id);
        }
        onClose?.();

        // Tin nhắn mới trong chat: mở thẳng trang chat của người vừa nhắn
        // BE: notifyNewMessage(...) => refType="CONVERSATION", refId=null
        if (n?.type === 'MESSAGE' && n?.refType === 'CONVERSATION') {
            const senderName = parseSenderNameFromNotificationContent(n?.content);
            const sessionId = await resolveChatSessionIdBySenderName(senderName);
            if (sessionId) navigate(`/chat?sessionId=${sessionId}`);
            else navigate('/chat');
            return;
        }

        // Các loại khác: điều hướng theo refType/refId (vd: tin đăng)
        if (n?.refType === 'LISTING' && n?.refId) {
            navigate(`/listings/${n.refId}`);
        }
    };

    const handleViewAll = () => {
        onClose?.();
        navigate('/notifications');
    };

    const topNotifications = notifications.slice(0, 5);

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
                sx: {
                    mt: 1,
                    width: 340,
                    maxHeight: 420,
                    borderRadius: 3,
                    boxShadow: '0 18px 45px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: '#201D26',
                    overflow: 'hidden',
                },
            }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#201D26',
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                    Thông báo
                </Typography>
                {unreadCount > 0 && (
                    <Button
                        size="small"
                        startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                        onClick={markAllRead}
                        sx={{
                            textTransform: 'none',
                            fontSize: 11,
                            borderRadius: 999,
                            px: 1.5,
                            py: 0.2,
                            bgcolor: 'rgba(157,110,237,0.2)',
                            color: '#9D6EED',
                            '&:hover': { bgcolor: 'rgba(157,110,237,0.3)' },
                        }}
                    >
                        Đọc hết
                    </Button>
                )}
            </Box>

            {notifications.length === 0 ? (
                <Box
                    sx={{
                        px: 2,
                        py: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: '#201D26',
                    }}
                >
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)',
                        }}
                    >
                        <NotificationsIcon />
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Chưa có thông báo mới
                    </Typography>
                </Box>
            ) : (
                <List
                    dense
                    disablePadding
                    sx={{
                        maxHeight: 320,
                        overflowY: 'auto',
                        bgcolor: '#201D26',
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            borderRadius: 999,
                        },
                    }}
                >
                    {topNotifications.map((n) => (
                        <ListItem
                            key={n.id}
                            onClick={() => handleItemClick(n)}
                            sx={{
                                px: 2,
                                py: 1.25,
                                cursor: 'pointer',
                                bgcolor: n.isRead ? 'transparent' : 'rgba(157,110,237,0.12)',
                                '&:hover': {
                                    bgcolor: n.isRead ? 'rgba(255,255,255,0.06)' : 'rgba(157,110,237,0.18)',
                                },
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        bgcolor: n.isRead ? 'rgba(255,255,255,0.08)' : 'rgba(157,110,237,0.25)',
                                        color: n.isRead ? 'rgba(255,255,255,0.6)' : '#9D6EED',
                                    }}
                                >
                                    {getIconForType(n.type)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: n.isRead ? 400 : 600,
                                            color: 'rgba(255,255,255,0.9)',
                                        }}
                                    >
                                        {n.content}
                                    </Typography>
                                }
                                secondary={
                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            color: 'rgba(255,255,255,0.5)',
                                            mt: 0.25,
                                        }}
                                    >
                                        {formatTime(n.createdAt)}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            <Box
                sx={{
                    px: 2,
                    py: 1,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: '#201D26',
                }}
            >
                <Button
                    size="small"
                    onClick={handleViewAll}
                    sx={{
                        textTransform: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        bgcolor: 'rgba(157,110,237,0.25)',
                        '&:hover': {
                            bgcolor: 'rgba(157,110,237,0.4)',
                            color: '#FFFFFF',
                        },
                    }}
                >
                    Xem tất cả thông báo
                </Button>
            </Box>
        </Popover>
    );
}

