/**
 * Full-screen empty state — tin/post không còn hiển thị catalog công khai.
 */
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from 'react-router-dom';
import { CATALOG_UNAVAILABLE_MESSAGE } from '../../utils/catalogAvailability';

const DEFAULT_BG = '#141225';
const DEFAULT_TEXT = 'rgba(255,255,255,0.88)';
const DEFAULT_MUTED = 'rgba(255,255,255,0.45)';

export default function CatalogItemUnavailableScreen({
    message = CATALOG_UNAVAILABLE_MESSAGE,
    backLabel = 'Quay lại',
    onBack,
    bgcolor = DEFAULT_BG,
    textColor = DEFAULT_TEXT,
    mutedColor = DEFAULT_MUTED,
}) {
    const navigate = useNavigate();
    const handleBack = () => {
        if (typeof onBack === 'function') {
            onBack();
            return;
        }
        if (window.history.length > 1) navigate(-1);
        else navigate('/feed');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                bgcolor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                py: 6,
                boxSizing: 'border-box',
            }}
        >
            <Typography
                variant="body1"
                sx={{
                    textAlign: 'center',
                    maxWidth: 360,
                    color: textColor,
                    fontWeight: 500,
                    lineHeight: 1.6,
                    mb: 3,
                }}
            >
                {message}
            </Typography>
            <Typography variant="body2" sx={{ color: mutedColor, mb: 3, textAlign: 'center', maxWidth: 320 }}>
                Liên kết có thể đã cũ hoặc nội dung đã được gỡ khỏi chợ.
            </Typography>
            <Button
                variant="outlined"
                startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 16 }} />}
                onClick={handleBack}
                sx={{
                    textTransform: 'none',
                    borderColor: 'rgba(157,110,237,0.5)',
                    color: '#9D6EED',
                    '&:hover': { borderColor: '#9D6EED', bgcolor: 'rgba(157,110,237,0.08)' },
                }}
            >
                {backLabel}
            </Button>
        </Box>
    );
}
