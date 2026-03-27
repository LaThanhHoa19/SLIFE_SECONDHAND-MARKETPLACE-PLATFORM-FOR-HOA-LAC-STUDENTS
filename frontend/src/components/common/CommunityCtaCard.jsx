import { Box, Button, Typography } from '@mui/material';

export default function CommunityCtaCard({
                                             onAction,
                                             sx,
                                             title = 'Tham gia cộng đồng mua bán cùng SLIFE!',
                                             actionLabel = 'Đăng tin ngay',
                                         }) {
    return (
        <Box
            sx={{
                background: 'linear-gradient(145deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%)',
                borderRadius: '16px',
                p: 2.25,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                ...sx,
            }}
        >
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#EDE9FE', lineHeight: 1.45, mb: 1.5, pr: 4 }}>
                {title}
            </Typography>
            <Button
                onClick={onAction}
                sx={{
                    bgcolor: '#FFF',
                    color: '#6D28D9',
                    fontSize: '12px',
                    fontWeight: 700,
                    px: 2,
                    py: 0.75,
                    borderRadius: '10px',
                    textTransform: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    '&:hover': { bgcolor: '#FFF', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
                }}
            >
                {actionLabel}
            </Button>
            <Typography sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 32, opacity: 0.35, pointerEvents: 'none' }}>
                📢
            </Typography>
        </Box>
    );
}
