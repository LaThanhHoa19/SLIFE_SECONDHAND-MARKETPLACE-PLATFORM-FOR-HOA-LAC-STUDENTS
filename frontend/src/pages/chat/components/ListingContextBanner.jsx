import { Box, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

export default function ListingContextBanner({
    theme,
    activeSession,
    activeListingThumb,
    isSellerInActiveChat = false,
    onFinalizeOrder,
    finalizeDisabled = false,
    showPostSaleActions = false,
    /** Một nút: gọi ẩn tin (HIDDEN), không còn tách Đã bán / Ẩn tin. */
    onPostSaleAction,
    postSaleOutcome = null,
    postSaleBusy = false,
    hideViewListing = false,
}) {
    if (activeSession?.listingId == null) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
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
            {isSellerInActiveChat && !showPostSaleActions && (
                <Chip
                    size="small"
                    label="Chốt đơn"
                    variant="outlined"
                    clickable
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFinalizeOrder?.();
                    }}
                    sx={{
                        fontWeight: 800,
                        borderColor: alpha(theme.palette.primary.main, 0.55),
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        opacity: finalizeDisabled ? 0.7 : 1,
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            borderColor: alpha(theme.palette.primary.main, 0.7),
                        },
                    }}
                />
            )}

            {isSellerInActiveChat && showPostSaleActions && postSaleOutcome == null && (
                <Chip
                    size="small"
                    label="Đã bán / ẩn tin"
                    variant="outlined"
                    clickable={!postSaleBusy && Boolean(onPostSaleAction)}
                    disabled={postSaleBusy}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!postSaleBusy) onPostSaleAction?.();
                    }}
                    sx={{
                        fontWeight: 900,
                        borderColor: alpha(theme.palette.primary.main, 0.55),
                        color: theme.palette.primary.light,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.16),
                            borderColor: alpha(theme.palette.primary.main, 0.8),
                        },
                    }}
                />
            )}
            {isSellerInActiveChat && showPostSaleActions && postSaleOutcome === 'hidden' && (
                <Chip
                    size="small"
                    label="Tin đã ẩn"
                    variant="outlined"
                    sx={{
                        fontWeight: 800,
                        borderColor: alpha(theme.palette.warning.main, 0.45),
                        color: theme.palette.warning.light,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                    }}
                />
            )}
            {!hideViewListing && (
                <Chip
                    size="small"
                    component={Link}
                    to={`/listings/${activeSession.listingId}`}
                    icon={<OpenInNewIcon fontSize="small" />}
                    label="Xem tin"
                    variant="outlined"
                    clickable
                    onClick={(e) => e.stopPropagation()}
                />
            )}
        </Box>
    );
}

