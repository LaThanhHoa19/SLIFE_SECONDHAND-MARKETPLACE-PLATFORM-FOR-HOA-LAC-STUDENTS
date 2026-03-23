/**
 *
 */
import { Avatar, Box, Button, Chip, Typography } from '@mui/material';
import { useContext, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EmptyIcon from '@mui/icons-material/NotificationsOff';
import { NotificationContext } from '../../providers/NotificationProvider';
import NotificationTypeIcon from '../../components/common/NotificationTypeIcon';
import {
    NOTIF_TAB,
    NOTIF_TAB_LABELS,
    NOTIF_TABS_ORDER,
    deriveNotificationTab,
    notificationsForTab,
    countForTab,
    tabFromSearchParam,
} from '../../utils/notificationCategory';

const CARD_BG = '#201D26';
const CARD_BG_HOVER = '#252230';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT_PRI = 'rgba(255,255,255,0.95)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';
const PURPLE_DIM = 'rgba(157,110,237,0.18)';

const formatNotificationTime = (createdAt) => {
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

export default function NotificationsPage() {
    const { notifications, unreadCount, markRead, markAllRead } = useContext(NotificationContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const tab = tabFromSearchParam(searchParams.get('tab'));
    const setTab = (key) => {
        if (key === NOTIF_TAB.ALL) setSearchParams({}, { replace: true });
        else setSearchParams({ tab: key }, { replace: true });
    };

    const filtered = useMemo(() => notificationsForTab(notifications, tab), [notifications, tab]);

    const handleRowClick = (n) => {
        if (!n.isRead) markRead(n.id);
        const ref = String(n.refType || '').toUpperCase();
        const id = n.refId;
        if (id && (ref === 'LISTING' || ref === 'LISTING_PUBLISHED')) {
            navigate(`/listings/${id}`);
        }
    };

    return (
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 2, maxWidth: 640, mx: 'auto', pb: 4 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 2,
                    flexWrap: 'wrap',
                }}
            >
                <Typography variant="h5" fontWeight={800} sx={{ color: TEXT_PRI, letterSpacing: '-0.02em' }}>
                    Thông báo
                </Typography>
                {unreadCount > 0 && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DoneAllIcon />}
                        onClick={markAllRead}
                        sx={{
                            borderColor: PURPLE,
                            color: PURPLE,
                            textTransform: 'none',
                            borderRadius: 2,
                            '&:hover': { borderColor: '#b794f6', bgcolor: PURPLE_DIM, color: '#e9d5ff' },
                        }}
                    >
                        Đánh dấu đã đọc
                    </Button>
                )}
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    pb: 1.5,
                    mb: 2,
                    mx: -0.5,
                    px: 0.5,
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { height: 5 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 },
                }}
            >
                {NOTIF_TABS_ORDER.map((key) => {
                    const count = key === NOTIF_TAB.ALL ? notifications.length : countForTab(notifications, key);
                    const selected = tab === key;
                    return (
                        <Chip
                            key={key}
                            label={
                                key === NOTIF_TAB.ALL
                                    ? NOTIF_TAB_LABELS[key]
                                    : `${NOTIF_TAB_LABELS[key]}${count > 0 ? ` · ${count}` : ''}`
                            }
                            onClick={() => setTab(key)}
                            aria-pressed={selected}
                            variant={selected ? 'filled' : 'outlined'}
                            sx={{
                                flexShrink: 0,
                                fontWeight: selected ? 700 : 500,
                                fontSize: 13,
                                height: 32,
                                borderRadius: 2,
                                bgcolor: selected ? PURPLE : 'transparent',
                                color: selected ? '#fff' : TEXT_SEC,
                                borderColor: selected ? PURPLE : BORDER,
                                '&:hover': {
                                    bgcolor: selected ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                                    borderColor: PURPLE,
                                },
                            }}
                        />
                    );
                })}
            </Box>

            {notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <EmptyIcon sx={{ fontSize: 64, color: TEXT_SEC, opacity: 0.35, mb: 2 }} />
                    <Typography sx={{ color: TEXT_PRI, fontWeight: 600, mb: 1 }}>Chưa có thông báo</Typography>
                    <Typography sx={{ color: TEXT_SEC, fontSize: 14, maxWidth: 320, mx: 'auto' }}>
                        Tin nhắn, trả giá, bình luận và duyệt tin sẽ gom tại đây. Chọn chip phía trên để lọc nhanh.
                    </Typography>
                </Box>
            ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <EmptyIcon sx={{ fontSize: 56, color: TEXT_SEC, opacity: 0.3, mb: 2 }} />
                    <Typography sx={{ color: TEXT_SEC, fontSize: 15 }}>
                        Không có mục trong &quot;{NOTIF_TAB_LABELS[tab]}&quot;
                    </Typography>
                    <Button
                        size="small"
                        sx={{ mt: 2, textTransform: 'none', color: PURPLE }}
                        onClick={() => setTab(NOTIF_TAB.ALL)}
                    >
                        Xem tất cả
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {filtered.map((n) => {
                        const unread = !n.isRead;
                        return (
                            <Box
                                key={n.id}
                                onClick={() => handleRowClick(n)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleRowClick(n);
                                    }
                                }}
                                sx={{
                                    display: 'flex',
                                    gap: 1.5,
                                    p: 1.75,
                                    borderRadius: 2,
                                    bgcolor: unread ? PURPLE_DIM : CARD_BG,
                                    border: `1px solid ${unread ? 'rgba(157,110,237,0.35)' : BORDER}`,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s, border-color 0.2s',
                                    '&:hover': {
                                        bgcolor: unread ? 'rgba(157,110,237,0.22)' : CARD_BG_HOVER,
                                        borderColor: unread ? 'rgba(157,110,237,0.45)' : 'rgba(255,255,255,0.12)',
                                    },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        flexShrink: 0,
                                        bgcolor: unread ? 'rgba(157,110,237,0.35)' : 'rgba(255,255,255,0.08)',
                                        color: unread ? '#e9d5ff' : TEXT_SEC,
                                    }}
                                >
                                    <NotificationTypeIcon notification={n} fontSize={20} />
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            flexWrap: 'wrap',
                                            mb: 0.5,
                                        }}
                                    >
                                        {unread && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: PURPLE,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                        <Chip
                                            size="small"
                                            label={tabLabelForItem(n)}
                                            sx={{
                                                height: 22,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                bgcolor: 'rgba(255,255,255,0.08)',
                                                color: TEXT_SEC,
                                                border: 'none',
                                            }}
                                        />
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: unread ? 600 : 400,
                                            color: TEXT_PRI,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {n.content}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: PURPLE, mt: 0.75, opacity: 0.9 }}>
                                        {formatNotificationTime(n.createdAt)}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}
