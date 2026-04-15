import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Fade, Stack, Typography } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ListingsFeed from '../../components/listing/ListingsFeed';
import { getLikedListings } from '../../api/listingApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { getSellerIdFromListingItem } from '../../utils/listingFormatUtils';

const UNAVAILABLE_STATUSES = new Set(['HIDDEN', 'MOD_HIDDEN', 'DELETED', 'BANNED', 'EXPIRED']);

function normalizeLikedList(payload) {
    const list = Array.isArray(payload?.content) ? payload.content : [];
    const normalized = list.map((item) => {
        const status = String(item?.status || item?.itemStatus || '').toUpperCase();
        const isUnavailable = UNAVAILABLE_STATUSES.has(status);
        return {
            ...item,
            isUnavailable,
            unavailableMessage: isUnavailable
                ? 'Tin đã thích hiện không còn khả dụng.'
                : undefined,
        };
    });

    return {
        data: normalized,
        totalPages: Number(payload?.totalPages ?? 0),
        totalElements: Number(payload?.totalElements ?? list.length),
    };
}

export default function LikedListingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({ totalPages: 0, totalElements: 0 });
    const [feedEntered, setFeedEntered] = useState(false);
    const [viewMode, setViewMode] = useState('list');

    const loadLiked = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getLikedListings({ page: 0, size: 200 });
            const payload = unwrapApiData(res);
            const normalized = normalizeLikedList(payload);
            setData(normalized.data);
            setMeta({ totalPages: normalized.totalPages, totalElements: normalized.totalElements });
        } catch (e) {
            setError(e?.message || 'Không tải được danh sách tin đã thích.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLiked();
    }, [loadLiked]);

    useEffect(() => {
        if (isLoading) {
            setFeedEntered(false);
            return;
        }
        if (error || data.length === 0) {
            return;
        }
        const t = window.setTimeout(() => setFeedEntered(true), 30);
        return () => window.clearTimeout(t);
    }, [isLoading, error, data.length]);

    const patchListing = useCallback((listingId, patch) => {
        if (!patch || typeof patch !== 'object') return;
        if (patch.removeSellerId != null) {
            const sid = String(patch.removeSellerId);
            setData((prev) => {
                const next = prev.filter((item) => {
                    const itemSid = getSellerIdFromListingItem(item);
                    return itemSid == null || String(itemSid) !== sid;
                });
                setMeta((m) => ({ ...m, totalElements: next.length }));
                return next;
            });
            return;
        }
        if (listingId == null) return;
        if (patch.removeFromList === true) {
            setData((prev) => {
                const next = prev.filter((item) => {
                    const lid = item?.id ?? item?.listingId ?? item?.listing_id;
                    return lid == null || String(lid) !== String(listingId);
                });
                setMeta((m) => ({ ...m, totalElements: next.length }));
                return next;
            });
            return;
        }
        setData((prev) => {
            const next = prev
                .map((item) => {
                    const lid = item?.id ?? item?.listingId ?? item?.listing_id;
                    if (lid == null || String(lid) !== String(listingId)) return item;
                    return { ...item, ...patch };
                })
                .filter((item) => item?.isLiked !== false);
            setMeta((m) => ({ ...m, totalElements: next.length }));
            return next;
        });
    }, []);

    const toggleButtonSx = (active) => ({
        textTransform: 'none',
        borderRadius: '999px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        minWidth: 0,
        px: 1.5,
        py: 0.65,
        fontSize: 12.5,
        ...(active
            ? {
                bgcolor: '#fff',
                color: '#0d0d0d',
                border: '1px solid #fff',
                '&:hover': { bgcolor: '#f3f4f6' },
            }
            : {
                color: 'rgba(255,255,255,0.72)',
                borderColor: 'rgba(255,255,255,0.18)',
                bgcolor: 'transparent',
                '&:hover': { borderColor: 'rgba(255,255,255,0.34)' },
            }),
    });

    return (
        <Box sx={{ p: { xs: 1.5, md: 2.5 }, maxWidth: 980, mx: 'auto', width: '100%' }}>
            <Box
                sx={{
                    mb: 2,
                    border: '1px solid rgba(167,139,250,0.22)',
                    borderRadius: 3,
                    px: { xs: 2, md: 2.5 },
                    py: { xs: 1.6, md: 1.9 },
                    bgcolor: 'rgba(33, 27, 52, 0.9)',
                }}
            >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <FavoriteRoundedIcon sx={{ color: '#f43f5e', fontSize: 19 }} />
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: 22, md: 26 }, letterSpacing: '-0.01em' }}>
                                Đã thích
                            </Typography>
                            <Chip
                                size="small"
                                label={meta.totalElements || 0}
                                sx={{
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 22,
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.16)',
                                }}
                            />
                        </Stack>
                        <Typography sx={{ mt: 0.55, color: 'rgba(255,255,255,0.62)', fontSize: 13.5 }}>
                            Danh sách bài đăng bạn đã thả tim.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.8}>
                        <Button
                            variant={viewMode === 'list' ? 'contained' : 'outlined'}
                            startIcon={<ViewListIcon sx={{ fontSize: 18 }} />}
                            onClick={() => setViewMode('list')}
                            sx={toggleButtonSx(viewMode === 'list')}
                        >
                            Danh sách
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                            startIcon={<GridViewIcon sx={{ fontSize: 18 }} />}
                            onClick={() => setViewMode('grid')}
                            sx={toggleButtonSx(viewMode === 'grid')}
                        >
                            Lưới
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            {error ? (
                <Fade in timeout={260}>
                    <Alert
                        severity="error"
                        variant="filled"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<RefreshRoundedIcon />}
                                onClick={loadLiked}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Thử lại
                            </Button>
                        }
                        sx={{ borderRadius: 2.5, '& .MuiAlert-message': { fontSize: 13.5 } }}
                    >
                        {error}
                    </Alert>
                </Fade>
            ) : !isLoading && data.length === 0 ? (
                <Fade in timeout={280}>
                    <Box
                        sx={{
                            p: 3.5,
                            borderRadius: 3,
                            textAlign: 'center',
                            bgcolor: 'rgba(33, 27, 52, 0.9)',
                            border: '1px solid rgba(167,139,250,0.25)',
                        }}
                    >
                        <FavoriteRoundedIcon sx={{ fontSize: 38, color: 'rgba(244,63,94,0.9)', mb: 1 }} />
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16, mb: 0.6 }}>
                            Chưa có tin đã thích
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: 13.5, mb: 2, lineHeight: 1.6 }}>
                            Thả tim ở feed để lưu lại các sản phẩm bạn quan tâm.
                        </Typography>
                        <Button
                            variant="contained"
                            href="/feed"
                            startIcon={<ExploreRoundedIcon />}
                            sx={{
                                textTransform: 'none',
                                borderRadius: '999px',
                                bgcolor: '#fff',
                                color: '#111',
                                px: 2.2,
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#e5e7eb' },
                            }}
                        >
                            Mở feed
                        </Button>
                    </Box>
                </Fade>
            ) : (
                <Box
                    sx={{
                        opacity: feedEntered ? 1 : 0,
                        transform: feedEntered ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 220ms ease, transform 240ms ease',
                        willChange: 'opacity, transform',
                    }}
                >
                    <ListingsFeed
                        listings={data}
                        isLoading={isLoading}
                        viewMode={viewMode}
                        cardVariant="default"
                        onPatchListing={patchListing}
                    />

                    <Box
                        sx={{
                            mt: 2,
                            borderRadius: 3,
                            border: '1px dashed rgba(255,255,255,0.2)',
                            px: 2,
                            py: 1.6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            bgcolor: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                            <Button
                                variant="contained"
                                href="/feed"
                                sx={{
                                    minWidth: 38,
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    p: 0,
                                    bgcolor: '#fff',
                                    color: '#111',
                                    '&:hover': { bgcolor: '#e5e7eb' },
                                }}
                            >
                                <AddRoundedIcon sx={{ fontSize: 20 }} />
                            </Button>
                            <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 13.5, fontWeight: 500 }}>
                                Tìm thêm sản phẩm hợp gu của bạn
                            </Typography>
                        </Stack>
                        <Button
                            size="small"
                            startIcon={<ExploreRoundedIcon />}
                            href="/feed"
                            sx={{
                                textTransform: 'none',
                                color: '#fff',
                                borderRadius: '999px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                px: 1.4,
                                '&:hover': { borderColor: 'rgba(255,255,255,0.38)' },
                            }}
                        >
                            Khám phá
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
