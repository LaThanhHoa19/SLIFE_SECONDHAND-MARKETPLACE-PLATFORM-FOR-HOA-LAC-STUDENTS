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

export default function Footer() {
    const navigate = useNavigate();

    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: '#201D26',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                py: 1.5,
                px: 3,
            }}
        >
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
        </Box>
    );
}
