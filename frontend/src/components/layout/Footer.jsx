/** Mục đích: Footer đơn giản 1 dòng link chính sách/trợ giúp. */
import { Box, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LINKS = [
    { label: 'Góp ý', href: '/feedback' },
    { label: 'Quy chế hoạt động', href: '/terms' },
    { label: 'Chính sách bảo mật', href: '/privacy' },
    { label: 'Giải quyết tranh chấp', href: '/dispute' },
    { label: 'Thông tin trợ giúp', href: '/help' },
    { label: 'An toàn mua bán', href: '/safety' },
    { label: 'Liên hệ hỗ trợ', href: '/contact' },
];

const MINIMAL_LINKS = [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Community Guidelines', href: '/safety' },
    { label: 'Contact', href: '/contact' },
];

export default function Footer({ variant = 'default' }) {
    const navigate = useNavigate();
    const isMinimal = variant === 'minimal';
    const year = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                background: isMinimal ? '#141225' : 'linear-gradient(180deg, #171522 0%, #141225 100%)',
                borderTop: isMinimal
                    ? '1px solid rgba(167,139,250,0.18)'
                    : '1px solid rgba(255,255,255,0.05)',
                py: isMinimal ? 1.25 : 1.5,
                px: 3,
            }}
        >
            {isMinimal ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        rowGap: 1,
                        columnGap: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ color: '#A78BFA', fontWeight: 700, fontSize: '1.05rem' }}>SLIFE</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                            © {year} SLIFE. All rights reserved.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
                        {MINIMAL_LINKS.map((link, index) => (
                            <Box key={link.href} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Link
                                    component="button"
                                    onClick={() => navigate(link.href)}
                                    underline="none"
                                    sx={{
                                        color: 'rgba(255,255,255,0.55)',
                                        fontSize: '12px',
                                        px: 1.25,
                                        py: 0.25,
                                        transition: 'color 0.15s',
                                        '&:hover': { color: '#FFFFFF' },
                                    }}
                                >
                                    {link.label}
                                </Link>
                                {index < MINIMAL_LINKS.length - 1 && (
                                    <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', userSelect: 'none' }}>
                                        |
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                    {LINKS.map((link, index) => (
                        <Box key={link.href} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Link
                                component="button"
                                onClick={() => navigate(link.href)}
                                underline="none"
                                sx={{
                                    color: 'rgba(255,255,255,0.55)',
                                    fontSize: '12px',
                                    px: 1.5,
                                    py: 0.25,
                                    transition: 'color 0.15s',
                                    '&:hover': { color: '#FFFFFF' },
                                }}
                            >
                                {link.label}
                            </Link>
                            {index < LINKS.length - 1 && (
                                <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', userSelect: 'none' }}>
                                    |
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
