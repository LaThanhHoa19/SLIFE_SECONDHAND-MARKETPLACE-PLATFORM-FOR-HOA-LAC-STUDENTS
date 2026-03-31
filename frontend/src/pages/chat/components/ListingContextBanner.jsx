import { Box, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

export default function ListingContextBanner({ theme, activeSession, activeListingThumb }) {
    if (activeSession?.listingId == null) return null;

    return (
        <Box
            component={Link}
            to={`/listings/${activeSession.listingId}`}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { bgcolor: 'action.hover' },
            }}
        >
            {activeListingThumb ? (
                <Box
                    component="img"
                    src={activeListingThumb}
                    alt={activeSession.listingTitle || 'Ảnh tin đăng'}
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 1.5,
                        objectFit: 'cover',
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.35),
                        flexShrink: 0,
                    }}
                />
            ) : (
                <Box
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        border: '1px dashed',
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        flexShrink: 0,
                    }}
                >
                    <StorefrontOutlinedIcon color="primary" />
                </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                    Tin đang trao đổi
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                    {activeSession.listingTitle || `Tin #${activeSession.listingId}`}
                </Typography>
            </Box>
            <Chip size="small" icon={<OpenInNewIcon fontSize="small" />} label="Xem tin" variant="outlined" />
        </Box>
    );
}

