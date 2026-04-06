import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { STITCH_PURPLE } from './myListingsConfig';

export default function MyListingsAddPlaceholder({ onClick }) {
    return (
        <Box
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            sx={{
                borderRadius: '16px',
                minHeight: 180,
                border: '2px dashed rgba(124, 92, 252, 0.35)',
                bgcolor: 'rgba(124, 92, 252, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                '&:hover': {
                    borderColor: 'rgba(124, 92, 252, 0.55)',
                    bgcolor: 'rgba(124, 92, 252, 0.08)',
                    boxShadow: '0 0 32px rgba(124, 92, 252, 0.12)',
                },
            }}
        >
            <Box sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: 'rgba(124, 92, 252, 0.15)',
                border: `1px solid rgba(124, 92, 252, 0.35)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <AddIcon sx={{ fontSize: 28, color: STITCH_PURPLE }} />
            </Box>
            <Typography fontSize={15} fontWeight={600} color="rgba(255,255,255,0.75)" textAlign="center" px={2}>
                Đăng thêm tin mới?
            </Typography>
            <Button
                type="button"
                variant="text"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                sx={{
                    color: STITCH_PURPLE,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'none',
                    gap: 0.5,
                    '&:hover': { bgcolor: 'rgba(124, 92, 252, 0.12)' },
                    '& .MuiButton-endIcon': { ml: 0.25 },
                }}
            >
                BẮT ĐẦU NGAY
            </Button>
        </Box>
    );
}
