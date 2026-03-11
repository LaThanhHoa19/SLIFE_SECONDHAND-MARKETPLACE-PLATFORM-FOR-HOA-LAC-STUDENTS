/**
 * SCRUM-172: Trang danh sách thông báo đầy đủ.
 */
import { Box, Button, Typography } from '@mui/material';
import { useContext } from 'react';
import { DoneAll as DoneAllIcon, NotificationsOff as EmptyIcon } from '@mui/icons-material';
import { NotificationContext } from '../../providers/NotificationProvider';

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

export default function NotificationsPage() {
    const { notifications, unreadCount, markRead, markAllRead } = useContext(NotificationContext);

    return (
        <Box sx={{ px: 2, py: 3, maxWidth: 640, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
                <Typography variant="h5" fontWeight={700} color="#7C3AED">
                    Thông báo
                </Typography>
                {unreadCount > 0 && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DoneAllIcon />}
                        onClick={markAllRead}
                        sx={{ borderColor: '#9D6EED', color: '#9D6EED', textTransform: 'none', '&:hover': { borderColor: '#7C3AED', bgcolor: '#faf5ff' } }}
                    >
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </Box>

            {notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <EmptyIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        Chưa có thông báo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Bạn sẽ nhận thông báo khi có tin nhắn mới, offer, deal xác nhận hoặc tin đăng bị báo cáo.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {notifications.map((n) => (
                        <Box
                            key={n.id}
                            onClick={() => !n.isRead && markRead(n.id)}
                            sx={{
                                p: 2,
                                borderRadius: '12px',
                                bgcolor: n.isRead ? '#fafafa' : '#faf5ff',
                                border: '1px solid',
                                borderColor: n.isRead ? '#eee' : '#ede9fe',
                                cursor: n.isRead ? 'default' : 'pointer',
                                transition: 'background 0.2s',
                                '&:hover': { bgcolor: n.isRead ? '#fafafa' : '#f5f0ff' },
                            }}
                        >
                            <Typography sx={{ fontSize: '14px', fontWeight: n.isRead ? 400 : 600, color: '#333' }}>
                                {n.content}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#9D6EED', mt: 0.5 }}>
                                {formatNotificationTime(n.createdAt)}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
