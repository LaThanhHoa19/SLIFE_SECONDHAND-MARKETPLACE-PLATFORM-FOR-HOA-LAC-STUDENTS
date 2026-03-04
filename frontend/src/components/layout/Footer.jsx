/** Mục đích: Footer cơ bản + link chính sách/trợ giúp. */
import {
    Box,
    Typography,
    Grid,
    Link,
    IconButton,
    useTheme,
    useMediaQuery,
    Divider
} from '@mui/material';
import {
    Facebook,
    LinkedIn,
    YouTube,
    Instagram
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: LinkedIn, href: '#', label: 'LinkedIn' },
        { icon: YouTube, href: '#', label: 'YouTube' },
        { icon: Instagram, href: '#', label: 'Instagram' }
    ];

    const aboutLinks = [
        { label: 'Giới thiệu', href: '/about' },
        { label: 'Quy chế hoạt động', href: '/terms' },
        { label: 'Chính sách bảo mật', href: '/privacy' },
        { label: 'Giải quyết tranh chấp', href: '/dispute' }
    ];

    const supportLinks = [
        { label: 'Trung tâm trợ giúp', href: '/help' },
        { label: 'An toàn mua bán', href: '/safety' },
        { label: 'Liên hệ hỗ trợ', href: '/contact' }
    ];

    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: '#201D26',
                color: '#FFFFFF',
                pt: 4,
                pb: 2
            }}
        >
            <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 2 }}>
                <Grid container spacing={4}>
                    {/* Logo & Social Links */}
                    <Grid item xs={12} md={4}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 'bold',
                                mb: 2,
                                color: '#FFFFFF',
                                fontSize: '24px'
                            }}
                        >
                            SLIFE
                        </Typography>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#9D6EED',
                                mb: 3,
                                fontWeight: 500,
                                fontSize: '14px'
                            }}
                        >
                            KẾT NỐI VỚI CHÚNG TÔI
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            {socialLinks.map((social, index) => {
                                const IconComponent = social.icon;
                                return (
                                    <IconButton
                                        key={index}
                                        href={social.href}
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            '&:hover': {
                                                backgroundColor: '#9D6EED',
                                                color: '#FFFFFF'
                                            },
                                            width: 36,
                                            height: 36
                                        }}
                                        aria-label={social.label}
                                    >
                                        <IconComponent fontSize="small" />
                                    </IconButton>
                                );
                            })}
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '13px'
                            }}
                        >
                            Email: trogian@gmail.com
                        </Typography>
                    </Grid>

                    {/* About SLIFE */}
                    <Grid item xs={12} md={4}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#9D6EED',
                                mb: 2,
                                fontWeight: 500,
                                fontSize: '14px'
                            }}
                        >
                            VỀ SLIFE
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {aboutLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(link.href);
                                    }}
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        '&:hover': {
                                            color: '#9D6EED',
                                            textDecoration: 'none'
                                        },
                                        py: 0.3
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </Box>
                    </Grid>

                    {/* Customer Support */}
                    <Grid item xs={12} md={4}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#9D6EED',
                                mb: 2,
                                fontWeight: 500,
                                fontSize: '14px'
                            }}
                        >
                            HỖ TRỢ KHÁCH HÀNG
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {supportLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(link.href);
                                    }}
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        '&:hover': {
                                            color: '#9D6EED',
                                            textDecoration: 'none'
                                        },
                                        py: 0.3
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </Box>
                    </Grid>
                </Grid>

                {/* Copyright */}
                <Divider sx={{ my: 2.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '12px'
                        }}
                    >
                        © {new Date().getFullYear()} SLIFE - Nền tảng mua bán đồ cũ cho sinh viên Hoa Lac.
                        Tất cả các quyền được bảo lưu.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
