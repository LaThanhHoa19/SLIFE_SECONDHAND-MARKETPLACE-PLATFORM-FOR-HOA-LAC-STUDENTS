/**
 * Popover thông báo trên Header — cùng logic/chip lọc với /notifications, deep link ?tab=
 */
import { Avatar, Box, Button, Chip, List, ListItem, ListItemAvatar, Popover, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../../providers/NotificationProvider';
import NotificationTypeIcon from './NotificationTypeIcon';
import {
    NOTIF_TAB,
    NOTIF_TAB_LABELS,
    NOTIF_TABS_ORDER,
    deriveNotificationTab,
    notificationsForTab,
    countForTab,
} from '../../utils/notificationCategory';

const PURPLE = '#9D6EED';
const BORDER = 'rgba(255,255,255,0.08)';
const CARD_BG = '#201D26';

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

const tabLabelForItem = (n) => NOTIF_TAB_LABELS[deriveNotificationTab(n)] || 'Khác';

export default function NotificationDropdown({ anchorEl, open, onClose }) {
    const { notifications, unreadCount, markRead, markAllRead } = useContext(NotificationContext);
    const navigate = useNavigate();
    const [tab, setTab] = useState(NOTIF_TAB.ALL);

    useEffect(() => {
        if (!open) setTab(NOTIF_TAB.ALL);
    }, [open]);

    const filtered = useMemo(() => notificationsForTab(notifications, tab), [notifications, tab]);
    const topNotifications = useMemo(() => filtered.slice(0, 5), [filtered]);

    const handleItemClick = async (n) => {
        if (!n.isRead) await markRead(n.id);
        onClose?.();
        const ref = String(n.refType || '').toUpperCase();
        if (n.refId && (ref === 'LISTING' || ref === 'LISTING_PUBLISHED')) {
            navigate(`/listings/${n.refId}`);
        }
    };

    const handleViewAll = () => {
        onClose?.();
        const q = tab !== NOTIF_TAB.ALL ? `?tab=${tab}` : '';
        navigate(`/notifications${q}`);
    };

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
                    width: { xs: 'min(100vw - 24px, 360px)', sm: 380 },
                    maxHeight: 480,
                    borderRadius: 2,
                    boxShadow: '0 18px 45px rgba(0,0,0,0.45)',
                    border: `1px solid ${BORDER}`,
                    bgcolor: CARD_BG,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <Box
                sx={{
                    px: 1.5,
                    pt: 1.5,
                    pb: 1,
                    borderBottom: `1px solid ${BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexShrink: 0,
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                    Thông báo
                </Typography>
                {unreadCount > 0 && (
                    <Button
                        size="small"
                        startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            markAllRead();
                        }}
                        sx={{
                            textTransform: 'none',
                            fontSize: 11,
                            borderRadius: 2,
                            px: 1.25,
                            py: 0.25,
                            minWidth: 0,
                            border: `1px solid rgba(157,110,237,0.45)`,
                            color: PURPLE,
                            '&:hover': { bgcolor: 'rgba(157,110,237,0.15)' },
                        }}
                    >
                        Đọc hết
                    </Button>
                )}
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    gap: 0.75,
                    overflowX: 'auto',
                    px: 1.5,
                    py: 1,
                    flexShrink: 0,
                    borderBottom: `1px solid ${BORDER}`,
                    '&::-webkit-scrollbar': { height: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 },
                }}
            >
                {NOTIF_TABS_ORDER.map((key) => {
                    const count = key === NOTIF_TAB.ALL ? notifications.length : countForTab(notifications, key);
                    const selected = tab === key;
                    return (
                        <Chip
                            key={key}
                            size="small"
                            label={
                                key === NOTIF_TAB.ALL
                                    ? NOTIF_TAB_LABELS[key]
                                    : `${NOTIF_TAB_LABELS[key]}${count > 0 ? ` ·${count}` : ''}`
                            }
                            onClick={() => setTab(key)}
                            variant={selected ? 'filled' : 'outlined'}
                            sx={{
                                flexShrink: 0,
                                height: 28,
                                fontSize: 11,
                                fontWeight: selected ? 700 : 500,
                                bgcolor: selected ? PURPLE : 'transparent',
                                color: selected ? '#fff' : 'rgba(255,255,255,0.55)',
                                borderColor: selected ? PURPLE : BORDER,
                                '&:hover': {
                                    bgcolor: selected ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                                },
                            }}
                        />
                    );
                })}
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
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)',
                        }}
                    >
                        <NotificationsIcon />
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                        Chưa có thông báo mới
                    </Typography>
                </Box>
            ) : topNotifications.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Không có mục trong &quot;{NOTIF_TAB_LABELS[tab]}&quot;
                    </Typography>
                </Box>
            ) : (
                <List
                    dense
                    disablePadding
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        maxHeight: 300,
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            borderRadius: 999,
                        },
                    }}
                >
                    {topNotifications.map((n) => {
                        const unread = !n.isRead;
                        return (
                            <ListItem
                                key={n.id}
                                onClick={() => handleItemClick(n)}
                                sx={{
                                    alignItems: 'flex-start',
                                    px: 1.5,
                                    py: 1.25,
                                    cursor: 'pointer',
                                    bgcolor: unread ? 'rgba(157,110,237,0.12)' : 'transparent',
                                    borderBottom: `1px solid ${BORDER}`,
                                    '&:last-of-type': { borderBottom: 'none' },
                                    '&:hover': {
                                        bgcolor: unread ? 'rgba(157,110,237,0.18)' : 'rgba(255,255,255,0.05)',
                                    },
                                }}
                            >
                                <ListItemAvatar sx={{ minWidth: 48, mt: 0.25 }}>
                                    <Box sx={{ position: 'relative' }}>
                                        {unread && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: -2,
                                                    left: -2,
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: PURPLE,
                                                    zIndex: 1,
                                                    border: '2px solid #201D26',
                                                }}
                                            />
                                        )}
                                        <Avatar
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                bgcolor: unread ? 'rgba(157,110,237,0.3)' : 'rgba(255,255,255,0.08)',
                                                color: unread ? '#e9d5ff' : 'rgba(255,255,255,0.55)',
                                            }}
                                        >
                                            <NotificationTypeIcon notification={n} fontSize={20} />
                                        </Avatar>
                                    </Box>
                                </ListItemAvatar>
                                <Box sx={{ flex: 1, minWidth: 0, pt: 0.125 }}>
                                    <Chip
                                        size="small"
                                        label={tabLabelForItem(n)}
                                        sx={{
                                            height: 20,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            maxWidth: '100%',
                                            mb: 0.5,
                                            bgcolor: 'rgba(255,255,255,0.08)',
                                            color: 'rgba(255,255,255,0.65)',
                                            '& .MuiChip-label': { px: 0.75 },
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: unread ? 600 : 400,
                                            color: 'rgba(255,255,255,0.92)',
                                            lineHeight: 1.4,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {n.content}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            color: PURPLE,
                                            mt: 0.35,
                                            opacity: 0.85,
                                        }}
                                    >
                                        {formatTime(n.createdAt)}
                                    </Typography>
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>
            )}

            <Box
                sx={{
                    px: 1.5,
                    py: 1,
                    borderTop: `1px solid ${BORDER}`,
                    flexShrink: 0,
                }}
            >
                <Button
                    fullWidth
                    size="small"
                    onClick={handleViewAll}
                    sx={{
                        textTransform: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fff',
                        borderRadius: 2,
                        bgcolor: 'rgba(157,110,237,0.28)',
                        '&:hover': { bgcolor: 'rgba(157,110,237,0.42)', color: '#fff' },
                    }}
                >
                    {tab === NOTIF_TAB.ALL
                        ? 'Xem tất cả thông báo'
                        : `Mở trang thông báo · ${NOTIF_TAB_LABELS[tab]}`}
                </Button>
            </Box>
        </Popover>
    );
}
