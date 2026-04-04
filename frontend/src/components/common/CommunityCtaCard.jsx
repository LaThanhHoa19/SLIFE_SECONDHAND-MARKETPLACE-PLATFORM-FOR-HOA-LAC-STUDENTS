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
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #9D6EED 100%)',
                borderRadius: '24px',
                p: 2.75,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(99, 102, 241, 0.35)',
                border: '1px solid rgba(255,255,255,0.14)',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)',
                    pointerEvents: 'none'
                },
                ...sx,
            }}
        >
            <Typography sx={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.4,
                mb: 2,
                pr: 5,
                letterSpacing: '-0.2px',
                textShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}>
                {title}
            </Typography>
            <Button
                onClick={onAction}
                sx={{
                    bgcolor: '#FFF',
                    color: '#6366f1',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    px: 2.5,
                    py: 1,
                    borderRadius: '12px',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(255,255,255,0.25)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                        bgcolor: '#f8fafc',
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: '0 6px 16px rgba(255,255,255,0.3)',
                    },
                    '&:active': { transform: 'scale(0.98)' }
                }}
            >
                {actionLabel}
            </Button>
            <Box
                sx={{
                    position: 'absolute',
                    right: -5,
                    bottom: -10,
                    fontSize: 72,
                    opacity: 0.15,
                    transform: 'rotate(-15deg)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}
            >
                📢
            </Box>
        </Box>
    );
}
