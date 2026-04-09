import React from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Stack,
    IconButton,
    useTheme,
    alpha
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EmailIcon from '@mui/icons-material/Email';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useNavigate } from 'react-router-dom';

const ContactCard = ({ icon: Icon, title, value, onClick, subtext }) => {
    const theme = useTheme();
    const accentColor = '#A78BFA'; // SLife purple

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 3.5,
                height: '100%',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 4,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: alpha(accentColor, 0.4),
                    boxShadow: `0 12px 24px ${alpha(accentColor, 0.12)}`,
                }
            }}
        >
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: alpha(accentColor, 0.12),
                    color: accentColor,
                    mb: 2.5
                }}
            >
                <Icon sx={{ fontSize: 32 }} />
            </Box>

            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 750, mb: 1 }}>
                {title}
            </Typography>

            <Typography variant="body1" sx={{ color: accentColor, fontWeight: 800, mb: 0.5 }}>
                {value}
            </Typography>

            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {subtext}
            </Typography>
        </Paper>
    );
};

export default function SupportContactPage() {
    const navigate = useNavigate();
    const accentColor = '#A78BFA';

    const handleEmail = () => window.location.href = 'mailto:trogiup@slife.vn';
    const handlePhone = () => window.location.href = 'tel:19003003';
    const handlePrivacy = () => navigate('/terms?key=general&item=privacy');

    return (
        <Box
            sx={{
                minHeight: '80vh',
                py: { xs: 4, md: 5 },
                background: 'linear-gradient(180deg, rgba(23,21,34,0) 0%, rgba(23,21,34,0.4) 100%)',
            }}
        >
            <Container maxWidth="lg">
                <Stack spacing={6} alignItems="center">
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 850,
                                color: '#FFFFFF',
                                mb: 2,
                                letterSpacing: '-0.02em'
                            }}
                        >
                            Liên hệ
                        </Typography>
                        <Box
                            sx={{
                                width: 48,
                                height: 4,
                                background: accentColor,
                                borderRadius: 10,
                                mx: 'auto',
                                mb: 3
                            }}
                        />
                        <Typography
                            variant="lg"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '1.1rem',
                                lineHeight: 1.6
                            }}
                        >
                            Đội ngũ SLife luôn sẵn sàng lắng nghe và hỗ trợ bạn trong mọi vấn đề liên quan đến nền tảng và cộng đồng.
                        </Typography>
                    </Box>

                    {/* Cards */}
                    <Grid container spacing={3.5} justifyContent="center" sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={6} md={5}>
                            <ContactCard
                                icon={EmailIcon}
                                title="Gửi Email"
                                value="trogiupslife@gmail.com"
                                subtext="Chúng tôi sẽ phản hồi thắc mắc của bạn trong vòng 24h làm việc."
                                onClick={handleEmail}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={5}>
                            <ContactCard
                                icon={PhoneInTalkIcon}
                                title="Hotline trợ giúp"
                                value="1900 3003"
                                subtext="Thời gian làm việc từ 8:00 - 17:00 (Thứ 2 đến Thứ 6)."
                                onClick={handlePhone}
                            />
                        </Grid>
                    </Grid>

                    {/* Footer Info */}
                    <Box
                        sx={{
                            mt: 8,
                            pt: 4,
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: 800
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                            divider={<Typography sx={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</Typography>}
                            sx={{ mb: 3 }}
                        >
                            <Typography
                                onClick={() => navigate('/contact')}
                                sx={{ color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', fontSize: '0.9rem', '&:hover': { color: accentColor } }}
                            >
                                Thông tin trợ giúp
                            </Typography>
                            <Typography
                                onClick={() => navigate('/terms?key=posting')}
                                sx={{ color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', fontSize: '0.9rem', '&:hover': { color: accentColor } }}
                            >
                                Tôi là người bán
                            </Typography>
                            <Typography
                                onClick={() => navigate('/terms?key=features')}
                                sx={{ color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', fontSize: '0.9rem', '&:hover': { color: accentColor } }}
                            >
                                Tôi là người mua
                            </Typography>
                        </Stack>

                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.85rem' }}>
                            © Bản quyền đã được bảo hộ bởi Cộng đồng Sinh viên SLife - Khu vực Hòa Lạc.
                            <br />
                            Thông tin của bạn sẽ được bảo mật theo <Typography component="span" onClick={handlePrivacy} sx={{ color: accentColor, cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>Chính sách bảo mật</Typography> của chúng tôi.
                        </Typography>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}
