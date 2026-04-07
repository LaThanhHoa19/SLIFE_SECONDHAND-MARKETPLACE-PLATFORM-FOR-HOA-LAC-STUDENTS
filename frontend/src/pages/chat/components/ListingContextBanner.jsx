import { Box, Chip, Link, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

export default function ListingContextBanner({
    theme,
    activeSession,
    activeListingThumb,
    isSellerInActiveChat = false,
    onFinalizeOrder,
    finalizeDisabled = false,
    showPostSaleActions = false,
    /** Một nút: gọi ẩn tin (HIDDEN).*/
    onPostSaleAction,
    postSaleOutcome = null,
    postSaleBusy = false,
    /** Tin không còn ACTIVE trên chợ (ẩn, gỡ, hết hạn, …) — không mở chi tiết tin, không chốt đơn/ẩn tin. */
    listingUnavailable = false,
}) {
    if (activeSession?.listingId == null) return null;

    const listingPath = `/listings/${activeSession.listingId}`;
    const listingTitle = activeSession.listingTitle || `Tin #${activeSession.listingId}`;
    const listingNavLabel = `Xem chi tiết tin — ${listingTitle}`;

    const bannerBody = (
        <>
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
                        opacity: listingUnavailable ? 0.65 : 1,
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
                <Typography
                    variant="caption"
                    color={listingUnavailable ? 'warning.light' : 'text.secondary'}
                    display="block"
                    fontWeight={listingUnavailable ? 700 : 400}
                >
                    {listingUnavailable
                        ? 'Bài đăng không còn tồn tại trên chợ'
                        : 'Tin đang trao đổi'}
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap color={listingUnavailable ? 'text.secondary' : 'inherit'}>
                    {listingTitle}
                </Typography>
            </Box>
        </>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            {listingUnavailable ? (
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        minWidth: 0,
                        py: 0.25,
                        pr: 0.5,
                    }}
                >
                    {bannerBody}
                </Box>
            ) : (
                <Link
                    component={RouterLink}
                    to={listingPath}
                    aria-label={listingNavLabel}
                    title={listingNavLabel}
                    underline="none"
                    color="inherit"
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        minWidth: 0,
                        borderRadius: 1.5,
                        py: 0.25,
                        pr: 0.5,
                        transition: 'background-color 0.15s ease',
                        '&:hover': { bgcolor: 'action.hover' },
                        '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: 2,
                        },
                    }}
                >
                    {bannerBody}
                </Link>
            )}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexShrink: 0,
                }}
            >
                {listingUnavailable ? (
                    <Chip
                        size="small"
                        label={
                            postSaleOutcome === 'gone'
                                ? 'Tin đã gỡ khỏi chợ'
                                : postSaleOutcome === 'hidden'
                                    ? 'Tin đã ẩn'
                                    : 'Tin không còn trên chợ'
                        }
                        variant="outlined"
                        sx={{
                            fontWeight: 800,
                            borderColor: alpha(theme.palette.warning.main, 0.5),
                            color: theme.palette.warning.light,
                            bgcolor: alpha(theme.palette.warning.main, 0.08),
                        }}
                    />
                ) : (
                    <>
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
                                label="Ẩn tin"
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
                    </>
                )}
            </Box>
        </Box>
    );
}
