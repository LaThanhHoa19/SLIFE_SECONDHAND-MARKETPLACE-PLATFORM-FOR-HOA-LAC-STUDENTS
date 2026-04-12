import { useState } from 'react';
import { Box, IconButton, Tooltip, Typography, Dialog, DialogContent, Slide, AppBar, Toolbar, Zoom } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import React from 'react';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';
export const RED = '#FF4757';

export default function ListingImageGallery({
                                                images,
                                                title,
                                                listingId,
                                                onShare,
                                                onReport,
                                                isSaved,
                                                onToggleSave,
                                                saveDisabled = false,
                                                likeCount = 0,
                                                isLiked = false,
                                                onToggleLike,
                                                likeDisabled = false,
                                                hideThumbs = false,
                                            }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [openZoom, setOpenZoom] = useState(false);
    const count = images.length;
    const src = count > 0 ? images[activeIdx] : null;

    // Reset index when listing changes
    React.useEffect(() => {
        setActiveIdx(0);
    }, [listingId]);

    const prev = (e) => {
        e?.stopPropagation();
        setActiveIdx((i) => (i - 1 + count) % count);
    };
    const next = (e) => {
        e?.stopPropagation();
        setActiveIdx((i) => (i + 1) % count);
    };

    const handleOpenZoom = () => setOpenZoom(true);
    const handleCloseZoom = () => setOpenZoom(false);

    return (
        <Box>
            {/* Ảnh chính */}
            <Box
                onClick={src ? handleOpenZoom : undefined}
                sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: { xs: '78%', md: '72%' },
                    borderRadius: '16px',
                    overflow: 'hidden',
                    bgcolor: '#2A2535',
                    border: `1px solid ${BORDER}`,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
                    cursor: src ? 'zoom-in' : 'default',
                    '&:hover .zoom-overlay': { opacity: 1 },
                }}
            >
                {src ? (
                    <>
                        <Box
                            component="img"
                            src={src}
                            alt={`${title} ${activeIdx + 1}`}
                            sx={{
                                position: 'absolute', inset: 0,
                                width: '100%', height: '100%', objectFit: 'cover',
                                transition: 'all 0.3s ease-in-out',
                            }}
                        />
                        <Box
                            className="zoom-overlay"
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                pointerEvents: 'none',
                            }}
                        >
                            <ZoomInIcon sx={{ fontSize: 48, color: '#fff', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }} />
                        </Box>
                    </>
                ) : (
                    <Box
                        sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <StorefrontIcon sx={{ fontSize: 56, color: TEXT_SEC, opacity: 0.4 }} />
                    </Box>
                )}

                {/* Like + counter — góc trái trên */}
                {typeof onToggleLike === 'function' && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: 'rgba(0,0,0,0.55)',
                            borderRadius: '20px',
                            pl: 0.5,
                            pr: 1,
                            py: 0.25,
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        <Tooltip title={isLiked ? 'Bỏ thích' : 'Thích'}>
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={likeDisabled}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleLike?.(e);
                                    }}
                                    sx={{
                                        color: isLiked ? RED : '#fff',
                                        width: 36,
                                        height: 36,
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'scale(1.06)' },
                                    }}
                                >
                                    {isLiked ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.95)" sx={{ minWidth: 12 }}>
                            {Number(likeCount) >= 0 ? Number(likeCount) : 0}
                        </Typography>
                    </Box>
                )}

                {/* Lưu tin (bookmark) + Share + Report góc phải trên */}
                <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1.2 }}>
                    <Tooltip title={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}>
                        <span>
                            <IconButton
                                size="small"
                                disabled={saveDisabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSave?.(e);
                                }}
                                sx={{
                                    bgcolor: 'rgba(0,0,0,0.55)',
                                    color: isSaved ? PURPLE : '#fff',
                                    width: 34,
                                    height: 34,
                                    backdropFilter: 'blur(4px)',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)', transform: 'scale(1.05)' },
                                }}
                            >
                                {isSaved ? <BookmarkIcon sx={{ fontSize: 17 }} /> : <BookmarkBorderIcon sx={{ fontSize: 17 }} />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Chia sẻ link">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare?.(e);
                            }}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                                width: 34, height: 34, backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: PURPLE, transform: 'scale(1.05)' },
                            }}
                        >
                            <ShareIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Báo cáo tin">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onReport?.(e);
                            }}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                                width: 34, height: 34, backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: RED, transform: 'scale(1.05)' },
                            }}
                        >
                            <FlagIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Nút chuyển ảnh – chỉ hiện khi có nhiều hơn 1 ảnh */}
                {count > 1 && (
                    <>
                        <IconButton
                            onClick={prev}
                            sx={{
                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                            }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <IconButton
                            onClick={next}
                            sx={{
                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                            }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                        {/* Số ảnh indicator */}
                        <Box
                            sx={{
                                position: 'absolute', bottom: 10, right: 12,
                                bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '20px',
                                px: 1.2, py: 0.3,
                            }}
                        >
                            <Typography fontSize={11} color="rgba(255,255,255,0.9)">
                                {activeIdx + 1}/{count}
                            </Typography>
                        </Box>
                    </>
                )}
            </Box>

            {/* Thumbnails */}
            {count > 1 && !hideThumbs && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        mt: 1.5,
                        px: 0,
                        py: 0,
                        bgcolor: 'transparent',
                        border: 'none',
                        overflowX: 'auto',
                        '::-webkit-scrollbar': { height: 4 },
                        '::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 },
                    }}
                >
                    {images.map((img, i) => (
                        <Box
                            key={i}
                            onClick={() => setActiveIdx(i)}
                            sx={{
                                position: 'relative',
                                flexShrink: 0,
                                width: 68,
                                height: 68,
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: `2px solid ${i === activeIdx ? PURPLE : 'transparent'}`,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                boxShadow: i === activeIdx
                                    ? `0 0 0 1px ${PURPLE}22, 0 4px 12px rgba(0,0,0,0.3)`
                                    : '0 2px 6px rgba(0,0,0,0.1)',
                                transform: i === activeIdx ? 'translateY(-1px)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    borderColor: i === activeIdx ? PURPLE : 'rgba(255,255,255,0.3)',
                                    transform: 'translateY(-1.5px)',
                                    zIndex: 2
                                },
                                '&::after': i !== activeIdx ? {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    bgcolor: 'rgba(15, 14, 20, 0.3)',
                                    transition: 'opacity 0.2s',
                                    pointerEvents: 'none'
                                } : {},
                                '&:hover::after': { opacity: 0 }
                            }}
                        >
                            <Box
                                component="img"
                                src={img}
                                alt={`thumb-${i}`}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: i === activeIdx ? 'none' : 'grayscale(0.2) brightness(0.9)'
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            )}
            {/* Fullscreen Zoom Dialog */}
            <Dialog
                open={openZoom}
                onClose={handleCloseZoom}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'rgb(15, 14, 20)',
                        color: '#fff',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        border: `1px solid ${BORDER}`,
                        boxShadow: '0 24px 64px rgba(0,0,0,0.8)'
                    }
                }}
            >
                <Box
                    sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${BORDER}`
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: TEXT_PRI, ml: 1 }}>
                        {title}
                    </Typography>
                    <IconButton
                        onClick={handleCloseZoom}
                        sx={{ color: TEXT_SEC, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 1, md: 3 },
                        bgcolor: 'rgba(255,255,255,0.02)',
                        overflow: 'hidden',
                        position: 'relative',
                        minHeight: '60vh'
                    }}
                >
                    {count > 1 && (
                        <>
                            <IconButton
                                onClick={prev}
                                sx={{
                                    position: 'absolute', left: { xs: 8, md: 24 }, zIndex: 2,
                                    bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', width: 44, height: 44,
                                    backdropFilter: 'blur(4px)',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)', transform: 'scale(1.1)' },
                                }}
                            >
                                <ChevronLeftIcon sx={{ fontSize: 28 }} />
                            </IconButton>
                            <IconButton
                                onClick={next}
                                sx={{
                                    position: 'absolute', right: { xs: 8, md: 24 }, zIndex: 2,
                                    bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', width: 44, height: 44,
                                    backdropFilter: 'blur(4px)',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)', transform: 'scale(1.1)' },
                                }}
                            >
                                <ChevronRightIcon sx={{ fontSize: 28 }} />
                            </IconButton>
                        </>
                    )}
                    <Box
                        component="img"
                        src={src}
                        sx={{
                            maxWidth: '100%',
                            maxHeight: '75vh',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
                        }}
                    />

                    {/* Floating thumbnails in zoom mode */}
                    {count > 1 && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 30,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: 1.5,
                                p: 1.5,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)',
                                maxWidth: '90vw',
                                overflowX: 'auto',
                                '::-webkit-scrollbar': { display: 'none' }
                            }}
                        >
                            {images.map((img, i) => (
                                <Box
                                    key={i}
                                    onClick={() => setActiveIdx(i)}
                                    sx={{
                                        width: 60, height: 60, borderRadius: '8px', overflow: 'hidden',
                                        border: `2px solid ${i === activeIdx ? PURPLE : 'transparent'}`,
                                        cursor: 'pointer', flexShrink: 0,
                                        transition: 'all 0.2s',
                                        '&:hover': { opacity: 0.8, transform: 'scale(1.05)' }
                                    }}
                                >
                                    <Box component="img" src={img} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
