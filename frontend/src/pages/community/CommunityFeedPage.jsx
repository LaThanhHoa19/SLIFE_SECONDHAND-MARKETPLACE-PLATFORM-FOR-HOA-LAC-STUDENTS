/**
 * Trang Cộng đồng — feed chia sẻ / hỏi đáp.
 */
import { Box, Button, Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';
import TagOutlinedIcon from '@mui/icons-material/TagOutlined';
import { useNavigate } from 'react-router-dom';
import RightPanel from '../../components/layout/RightPanel';
import { useAuth } from '../../hooks/useAuth';

const PLACEHOLDER_TAGS = ['Hỏi đáp', 'Ký túc xá', 'Học bổng', 'Đồ cũ', 'Sự kiện'];

export default function CommunityFeedPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const isDark = theme.palette.mode === 'dark';

    const goCreatePost = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/community/new' } });
            return;
        }
        navigate('/community/new');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                gap: { xs: 2, lg: 3 },
                p: 2,
                alignItems: 'flex-start',
                maxWidth: 1040,
                mx: 'auto',
                width: '100%',
                justifyContent: 'center',
            }}
        >
            <Box sx={{ flex: 1, minWidth: { xs: 0, sm: 400 }, maxWidth: 680 }}>
                <Box
                    sx={{
                        borderRadius: 3,
                        p: { xs: 2.5, sm: 3 },
                        mb: 2.5,
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(59,130,246,0.12) 50%, transparent 100%)'
                            : alpha(theme.palette.primary.main, 0.08),
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : alpha(theme.palette.primary.main, 0.2),
                    }}
                >
                    <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 1.5 }}>
                        <ForumOutlinedIcon sx={{ fontSize: 32, color: 'primary.light' }} />
                        <Typography variant="h5" fontWeight={800} sx={{ fontFamily: "'Outfit', sans-serif" }}>
                            Cộng đồng SLife
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                        Nơi sinh viên Hòa Lạc chia sẻ, hỏi đáp và bàn luận — tách biệt với{' '}
                        <strong>Feed mua bán</strong>. Bạn có thể tạo bài kèm ảnh và hashtag; feed danh sách sẽ được
                        bổ sung trên trang này.
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                        {PLACEHOLDER_TAGS.map((t) => (
                            <Chip
                                key={t}
                                size="small"
                                icon={<TagOutlinedIcon sx={{ fontSize: '16px !important' }} />}
                                label={t}
                                variant="outlined"
                                sx={{
                                    borderColor: alpha(theme.palette.primary.main, 0.45),
                                    color: 'text.secondary',
                                }}
                            />
                        ))}
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                        <Button
                            variant="contained"
                            startIcon={<PostAddOutlinedIcon />}
                            onClick={goCreatePost}
                            sx={{ fontWeight: 700 }}
                        >
                            Tạo bài đăng
                        </Button>
                        <Button variant="outlined" onClick={() => navigate('/feed')} sx={{ fontWeight: 700 }}>
                            Về Feed mua bán
                        </Button>
                    </Stack>
                </Box>

                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        bgcolor: isDark ? alpha('#fff', 0.04) : alpha(theme.palette.primary.main, 0.04),
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider',
                    }}
                >
                    <CardContent sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            Chưa có bài đăng cộng đồng
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>
                            Bấm &quot;Tạo bài đăng&quot; ở trên để đăng bài. Danh sách bài trên feed sẽ hiển thị khi
                            phần hiển thị feed được kết nối đầy đủ.
                        </Typography>
                        <Button variant="text" onClick={goCreatePost} sx={{ fontWeight: 700 }}>
                            Tạo bài đăng ngay
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            <RightPanel />
        </Box>
    );
}
