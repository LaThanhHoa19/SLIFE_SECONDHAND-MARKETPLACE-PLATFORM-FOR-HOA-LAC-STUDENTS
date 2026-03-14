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

export default function NotificationDropdown({ anchorEl, open, onClose }) {
    const { notifications, unreadCount, markRead, markAllRead } =
        useContext(NotificationContext);
    const navigate = useNavigate();

    const handleItemClick = async (n) => {
        if (!n.isRead) {
            await markRead(n.id);
        }
        onClose?.();
        // Điều hướng đơn giản theo refType nếu sau này cần mở rộng.
        if (n.refType === 'LISTING' && n.refId) {
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
                    boxShadow: '0 18px 45px rgba(15,23,42,0.25)',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                },
            }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
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
                            bgcolor: '#f5f3ff',
                            color: '#7c3aed',
                            '&:hover': { bgcolor: '#ede9fe' },
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
                    }}
                >
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#f3f4f6',
                            color: '#9ca3af',
                        }}
                    >
                        <NotificationsIcon />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
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
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': {
                            bgcolor: '#e5e7eb',
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
                                bgcolor: n.isRead ? 'transparent' : '#f5f3ff',
                                '&:hover': {
                                    bgcolor: n.isRead ? '#f9fafb' : '#ede9fe',
                                },
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        bgcolor: n.isRead ? '#f3f4f6' : '#eef2ff',
                                        color: '#4b5563',
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
                                            color: '#111827',
                                        }}
                                    >
                                        {n.content}
                                    </Typography>
                                }
                                secondary={
                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            color: '#9ca3af',
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
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Button
                    size="small"
                    onClick={handleViewAll}
                    sx={{
                        textTransform: 'none',
                        fontSize: 12,
                        color: '#4b5563',
                    }}
                >
                    Xem tất cả thông báo
                </Button>
            </Box>
        </Popover>
    );
}

