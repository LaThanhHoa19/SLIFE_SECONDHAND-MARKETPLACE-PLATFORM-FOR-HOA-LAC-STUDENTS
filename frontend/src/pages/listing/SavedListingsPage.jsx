import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Fade, Stack, Typography } from '@mui/material';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useSearchParams } from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import Pagination from '../../components/common/Pagination';
import { getSavedListings } from '../../api/listingApi';
import { unwrapApiData } from '../../utils/apiPayload';

const UNAVAILABLE_STATUSES = new Set(['HIDDEN', 'MOD_HIDDEN', 'DELETED', 'BANNED', 'EXPIRED']);

function normalizeSavedList(payload) {
    const list = Array.isArray(payload?.content) ? payload.content : [];
    const normalized = list.map((item) => {
        const status = String(item?.status || item?.itemStatus || '').toUpperCase();
        const isUnavailable = UNAVAILABLE_STATUSES.has(status);
        return {
            ...item,
            isUnavailable,
            unavailableMessage: isUnavailable
                ? 'Tin đã lưu hiện không còn khả dụng.'
                : undefined,
        };
    });

    return {
        data: normalized,
        totalPages: Number(payload?.totalPages ?? 0),
        totalElements: Number(payload?.totalElements ?? list.length),
    };
}

export default function SavedListingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({ totalPages: 0, totalElements: 0 });
    const [feedEntered, setFeedEntered] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    const page = Number(searchParams.get('page') || 0);
    const size = Number(searchParams.get('size') || 10);

    const loadSaved = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getSavedListings({ page, size });
            const payload = unwrapApiData(res);
            const normalized = normalizeSavedList(payload);
            setData(normalized.data);
            setMeta({ totalPages: normalized.totalPages, totalElements: normalized.totalElements });
        } catch (e) {
            setError(e?.message || 'Không tải được danh sách tin đã lưu.');
        } finally {
            setIsLoading(false);
        }
    }, [page, size]);

    useEffect(() => {
        loadSaved();
    }, [loadSaved]);

    useEffect(() => {
        if (isLoading) {
            setFeedEntered(false);
            return;
        }
        if (error || data.length === 0) {
            return;
        }
        const t = window.setTimeout(() => setFeedEntered(true), 40);
        return () => window.clearTimeout(t);
    }, [isLoading, error, data.length]);

    const patchListing = useCallback((listingId, patch) => {
        if (listingId == null || !patch || typeof patch !== 'object') return;
        if (patch.removeFromList === true) {
            setData((prev) =>
                prev.filter((item) => {
                    const lid = item?.id ?? item?.listingId ?? item?.listing_id;
                    return lid == null || String(lid) !== String(listingId);
                }),
            );
            return;
        }
        setData((prev) =>
            prev
                .map((item) => {
                    const lid = item?.id ?? item?.listingId ?? item?.listing_id;
                    if (lid == null || String(lid) !== String(listingId)) return item;
                    return { ...item, ...patch };
                })
                .filter((item) => item?.isSaved !== false),
        );
    }, []);

    const compactGrid = viewMode === 'grid' && data.length <= 1;

    const toggleButtonSx = (active) => ({
        textTransform: 'none',
        borderRadius: 2,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        minWidth: 0,
        px: 1.5,
        py: 0.8,
        ...(active
            ? { bgcolor: '#9D6EED', color: '#fff', '&:hover': { bgcolor: '#8A5BDF' } }
            : { color: '#D8C7FB', borderColor: 'rgba(157,110,237,0.4)', bgcolor: 'rgba(255,255,255,0.02)' }),
    });

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1240, mx: 'auto', width: '100%' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }} sx={{ mb: 2.25 }}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: { xs: 34, md: 46 }, lineHeight: 1.05 }}>
                            Tin đã lưu
                        </Typography>
                        <Chip
                            size="small"
                            label={`${meta.totalElements || 0} tin`}
                            sx={{
                                color: '#e9ddff',
                                fontWeight: 700,
                                fontSize: 12,
                                height: 24,
                                bgcolor: 'rgba(157,110,237,0.18)',
                                border: '1px solid rgba(157,110,237,0.42)',
                            }}
                        />
                    </Stack>
                    <Typography sx={{ mt: 0.9, color: 'rgba(226,232,240,0.88)', fontSize: 16, lineHeight: 1.55, maxWidth: 620 }}>
                        Quản lý nhanh các bài đăng bạn đã bookmark để xem lại hoặc liên hệ người bán.
                    </Typography>
                    <Typography sx={{ mt: 0.75, color: 'rgba(248,113,113,0.9)', fontSize: 13, lineHeight: 1.6, maxWidth: 620 }}>
                        Tin đã bị ẩn/xóa/không còn khả dụng sẽ được đánh dấu và không thể mở chi tiết.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                        startIcon={<GridViewIcon />}
                        onClick={() => setViewMode('grid')}
                        sx={toggleButtonSx(viewMode === 'grid')}
                    >
                        Dạng lưới
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'contained' : 'outlined'}
                        startIcon={<ViewListIcon />}
                        onClick={() => setViewMode('list')}
                        sx={toggleButtonSx(viewMode === 'list')}
                    >
                        Danh sách
                    </Button>
                </Stack>
            </Stack>

            {error ? (
                <Fade in timeout={280}>
                    <Alert
                        severity="error"
                        variant="filled"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<RefreshRoundedIcon />}
                                onClick={loadSaved}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Thử lại
                            </Button>
                        }
                        sx={{ borderRadius: 2, '& .MuiAlert-message': { fontSize: 13.5 } }}
                    >
                        {error}
                    </Alert>
                </Fade>
            ) : !isLoading && data.length === 0 ? (
                <Fade in timeout={340}>
                    <Box
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            textAlign: 'center',
                            bgcolor: '#201D26',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <BookmarkRoundedIcon sx={{ fontSize: 40, color: 'rgba(226,232,240,0.45)', mb: 1 }} />
                        <Typography sx={{ color: '#F9FAFB', fontWeight: 700, fontSize: 16, mb: 0.5 }}>
                            Chưa có tin đã lưu
                        </Typography>
                        <Typography sx={{ color: 'rgba(209,213,219,0.9)', fontSize: 13.5, mb: 2, lineHeight: 1.6 }}>
                            Hãy lưu các bài đăng bạn quan tâm để quay lại dễ hơn.
                        </Typography>
                        <Button
                            variant="contained"
                            href="/feed"
                            startIcon={<ExploreRoundedIcon />}
                            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#9D6EED', fontWeight: 600, '&:hover': { bgcolor: '#8A5BDF' } }}
                        >
                            Khám phá tin đăng
                        </Button>
                    </Box>
                </Fade>
            ) : (
                <>
                    <Box
                        sx={{
                            opacity: feedEntered ? 1 : 0,
                            transform: feedEntered ? 'translateY(0)' : 'translateY(14px)',
                            transition: 'opacity 320ms ease, transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
                            willChange: 'opacity, transform',
                            width: '100%',
                            display: { xs: 'block', lg: 'grid' },
                            gridTemplateColumns: { lg: compactGrid ? '320px 340px' : 'minmax(0, 760px) minmax(0, 1fr)' },
                            columnGap: { lg: compactGrid ? 1.5 : 3 },
                            alignItems: 'start',
                            justifyContent: { lg: compactGrid ? 'start' : 'stretch' },
                        }}
                    >
                        <Box sx={{ maxWidth: compactGrid ? 320 : 'none' }}>
                            <ListingsFeed
                                listings={data}
                                isLoading={isLoading}
                                viewMode={viewMode}
                                cardVariant="default"
                                onPatchListing={patchListing}
                            />
                            <Pagination
                                page={page}
                                totalPages={meta.totalPages}
                                totalElements={meta.totalElements}
                                pageSize={size}
                                onChange={(nextPage) => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set('page', String(nextPage));
                                    setSearchParams(params);
                                }}
                            />
                        </Box>
                        <Box
                            sx={{
                                display: { xs: 'none', lg: 'block' },
                                position: 'sticky',
                                top: 90,
                                alignSelf: 'start',
                                mt: viewMode === 'grid' ? -1 : 0,
                            }}
                        >
                            <Box
                                sx={{
                                    minHeight: compactGrid ? 320 : 460,
                                    maxWidth: compactGrid ? 340 : 'none',
                                    borderRadius: 3,
                                    border: '1px dashed rgba(148,163,184,0.18)',
                                    bgcolor: 'rgba(8,12,32,0.22)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Stack alignItems="center" spacing={1.5}>
                                    <Button
                                        variant="contained"
                                        href="/feed"
                                        sx={{
                                            minWidth: 54,
                                            width: 54,
                                            height: 54,
                                            borderRadius: '50%',
                                            p: 0,
                                            bgcolor: 'rgba(37,99,235,0.22)',
                                            color: '#c4b5fd',
                                            border: '1px solid rgba(167,139,250,0.35)',
                                            boxShadow: '0 0 0 6px rgba(167,139,250,0.04)',
                                            '&:hover': { bgcolor: 'rgba(37,99,235,0.3)' },
                                        }}
                                    >
                                        <AddRoundedIcon />
                                    </Button>
                                    <Typography
                                        sx={{
                                            textAlign: 'center',
                                            color: 'rgba(203,213,225,0.72)',
                                            fontSize: 20,
                                            fontWeight: 500,
                                            maxWidth: 240,
                                        }}
                                    >
                                        Lưu thêm các sản phẩm yêu thích
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<ExploreRoundedIcon />}
                                        href="/feed"
                                        sx={{
                                            textTransform: 'none',
                                            color: 'rgba(226,232,240,0.84)',
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                                        }}
                                    >
                                        Khám phá ngay
                                    </Button>
                                </Stack>
                            </Box>
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    );
}
