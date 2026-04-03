/**
 * MyListingsPage — Quản lý tin đăng (UI theo Stitch: grid card, filter, stats).
 * API: GET /api/listings/my?status=&page=&size=
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination as MuiPagination,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deleteDraft, getMyListings, hideListing, renewListing, repostListing, unhideListing } from '../../api/myListingApi';
import { useToast } from '../../context/ToastContext';
import DeleteDraftDialog from './myListings/DeleteDraftDialog';
import MyListingCard from './myListings/MyListingCard';
import MyListingsAddPlaceholder from './myListings/MyListingsAddPlaceholder';
import MyListingsEmptyState from './myListings/MyListingsEmptyState';
import MyListingsGridCardSkeleton from './myListings/MyListingsGridCardSkeleton';
import {
    ALL_TAB_STATUSES,
    pageFromSearchParams,
    PAGE_SIZE,
    STITCH_PAGE_GRADIENT,
    STITCH_PURPLE,
    STITCH_PURPLE_DEEP,
    STITCH_TAB_ACTIVE_BORDER,
    STITCH_TAB_ACTIVE_GRADIENT,
    STITCH_TAB_ACTIVE_SHADOW,
    STITCH_TAB_INACTIVE_BG,
    STITCH_TAB_INACTIVE_BORDER,
    TABS,
    tabFromSearchParams,
} from './myListings/myListingsConfig';
import { sortListings } from './myListings/myListingsUtils';

const SORT_LABELS = {
    newest: 'Mới nhất',
    oldest: 'Cũ nhất',
    price_high: 'Giá cao → thấp',
    price_low: 'Giá thấp → cao',
};

const TAB_CONTEXT_PHRASE = {
    ACTIVE:   'đang hoạt động',
    HIDDEN:   'đã ẩn',
    DRAFT:    'bản nháp',
    EXPIRED:  'hết hạn',
    // SOLD:     'đã bán',
    REPORTED: 'bị báo cáo',
};

const selectSx = {
    color: 'rgba(255,255,255,0.92)',
    borderRadius: '999px',
    fontSize: 14,
    bgcolor: 'rgba(255,255,255,0.04)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' },
    '&:hover fieldset': { borderColor: 'rgba(157, 110, 237, 0.35)' },
    '&.Mui-focused fieldset': { borderColor: STITCH_PURPLE },
};

const menuProps = {
    PaperProps: {
        sx: {
            bgcolor: '#201D26',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            mt: 0.5,
            color: 'rgba(255,255,255,0.92)',
            '& .MuiMenuItem-root': {
                fontSize: 13,
                borderRadius: '8px',
                mx: 0.5,
                color: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'rgba(157, 110, 237, 0.14)', color: '#fff' },
                '&.Mui-selected': {
                    bgcolor: 'rgba(157, 110, 237, 0.22)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(157, 110, 237, 0.3)' },
                },
                '&.Mui-focusVisible': { bgcolor: 'rgba(157, 110, 237, 0.18)' },
            },
        },
    },
};

export default function MyListingsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab,      setActiveTab]      = useState(() => tabFromSearchParams(searchParams));
    const [page,           setPage]           = useState(() => pageFromSearchParams(searchParams));
    const [listings,       setListings]       = useState([]);
    const [totalPages,     setTotalPages]     = useState(1);
    const [totalElements,  setTotalElements]  = useState(0);
    const [isLoading,      setLoading]        = useState(false);
    const [error,          setError]          = useState(null);
    const [tabCounts,      setTabCounts]      = useState({});
    const [searchQuery,    setSearchQuery]    = useState('');
    const [sortBy,         setSortBy]         = useState('newest');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [deleteDialog,   setDeleteDialog]   = useState({ open: false, listingId: null });
    const [isDeleting,     setIsDeleting]     = useState(false);
    const { showToast } = useToast();
    const abortRef = useRef(null);

    const showSnackbar = (message, severity = 'info') =>
        showToast(message, severity);

    const fetchTabCounts = useCallback(async () => {
        const results = await Promise.allSettled(
            ALL_TAB_STATUSES.map(s => getMyListings({ status: s, page: 0, size: 1 }))
        );
        const counts = {};
        ALL_TAB_STATUSES.forEach((s, i) => {
            if (results[i].status === 'fulfilled') {
                const payload = results[i].value?.data?.data ?? results[i].value?.data;
                counts[s] = payload?.totalElements ?? 0;
            } else {
                counts[s] = 0;
            }
        });
        setTabCounts(counts);
    }, []);

    const fetchListings = useCallback(async (tab, pg) => {
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setLoading(true);
        setError(null);
        try {
            const { data: res } = await getMyListings(
                { status: tab, page: pg, size: PAGE_SIZE },
                { signal: ctrl.signal }
            );
            if (ctrl.signal.aborted) return;

            const payload = res?.data ?? res;
            const list    = Array.isArray(payload?.content) ? payload.content : [];
            setListings(list);
            setTotalPages(payload?.totalPages ?? 1);
            setTotalElements(payload?.totalElements ?? list.length);
        } catch (err) {
            if (err?.name === 'CanceledError' || ctrl.signal.aborted) return;
            setError(err?.message || 'Không thể tải danh sách bài đăng. Vui lòng thử lại.');
        } finally {
            if (!ctrl.signal.aborted) setLoading(false);
        }
    }, []);

    const handleHide = async (id) => {
        try {
            await hideListing(id);
            showSnackbar('Đã ẩn tin thành công', 'success');
            fetchTabCounts();
            fetchListings(activeTab, page);
        } catch {
            showSnackbar('Không thể ẩn tin. Vui lòng thử lại.', 'error');
        }
    };

    const handleUnhide = async (id) => {
        try {
            await unhideListing(id);
            showSnackbar('Tin đăng đã hiển thị lại', 'success');
            fetchTabCounts();
            fetchListings(activeTab, page);
        } catch {
            showSnackbar('Không thể hiển thị lại tin. Vui lòng thử lại.', 'error');
        }
    };

    const handleRenew = async (id) => {
        try {
            await renewListing(id);
            showSnackbar('Đã gia hạn bài đăng thêm 15 ngày tính từ ngày hôm nay.', 'success');
            fetchListings(activeTab, page);
            fetchTabCounts();
        } catch {
            showSnackbar('Không thể gia hạn. Vui lòng thử lại.', 'error');
        }
    };

    const handleRepost = async (id) => {
        const sourceId = Number(id);
        if (!Number.isFinite(sourceId) || sourceId <= 0) {
            showSnackbar('Không xác định được tin cần đăng lại.', 'error');
            return;
        }
        try {
            const { data: body } = await repostListing(sourceId);
            const payload = body?.data;
            const newIdRaw =
                payload != null && typeof payload === 'object' && payload !== null && 'data' in payload
                    ? payload.data
                    : payload;
            const newId = newIdRaw != null && newIdRaw !== '' ? Number(newIdRaw) : NaN;
            showSnackbar('Đăng tin lại thành công', 'success');
            fetchTabCounts();
            fetchListings(activeTab, page);
            if (Number.isFinite(newId) && newId > 0) {
                navigate(`/listings/${newId}`);
            }
        } catch {
            showSnackbar('Không thể đăng lại. Vui lòng thử lại.', 'error');
        }
    };

    const handleDeleteDraft = (id) => {
        setDeleteDialog({ open: true, listingId: id });
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteDraft(deleteDialog.listingId);
            setDeleteDialog({ open: false, listingId: null });
            showSnackbar('Đã xóa bản nháp thành công.', 'success');
            fetchTabCounts();
            fetchListings(activeTab, page);
        } catch {
            showSnackbar('Không thể xóa bản nháp. Vui lòng thử lại.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialog({ open: false, listingId: null });
    };

    useEffect(() => {
        const tab = tabFromSearchParams(searchParams);
        const pg = pageFromSearchParams(searchParams);
        setActiveTab(tab);
        setPage(pg);
    }, [searchParams]);

    useEffect(() => {
        fetchListings(activeTab, page);
    }, [activeTab, page, fetchListings]);

    useEffect(() => {
        fetchTabCounts();
    }, [fetchTabCounts]);

    const handleTabChange = (_, newTab) => {
        setActiveTab(newTab);
        setPage(0);
        setSearchQuery('');
        setCategoryFilter('all');
        setSortBy('newest');
        setSearchParams({ status: newTab, page: '0' });
    };

    const handlePageChange = (_, newPage) => {
        const pg = newPage - 1;
        setPage(pg);
        setSearchParams({ status: activeTab, page: String(pg) });
    };

    const categoryOptions = useMemo(() => {
        const set = new Set();
        listings.forEach((l) => {
            if (l?.categoryName) set.add(l.categoryName);
        });
        return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))];
    }, [listings]);

    useEffect(() => {
        if (categoryFilter !== 'all' && !categoryOptions.includes(categoryFilter)) {
            setCategoryFilter('all');
        }
    }, [categoryOptions, categoryFilter]);

    const filteredListings = useMemo(() => {
        let list = listings;
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(l =>
                l.title?.toLowerCase().includes(q) ||
                l.location?.toLowerCase().includes(q)
            );
        }
        if (categoryFilter !== 'all') {
            list = list.filter((l) => l.categoryName === categoryFilter);
        }
        return sortListings(list, sortBy);
    }, [listings, searchQuery, categoryFilter, sortBy]);

    const contextPhrase = TAB_CONTEXT_PHRASE[activeTab] || '';

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minHeight: '100%',
                background: STITCH_PAGE_GRADIENT,
                py: { xs: 2.5, md: 3.5 },
                px: { xs: 0, sm: 0 },
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 1360, mx: 'auto', px: { xs: 0.5, sm: 0 } }}>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                    justifyContent="space-between"
                    gap={2.5}
                    sx={{ mb: 3.5 }}
                >
                    <Box>
                        <Typography
                            fontSize={{ xs: 24, md: 30 }}
                            fontWeight={800}
                            color="#fff"
                            sx={{ letterSpacing: '-0.04em', lineHeight: 1.12 }}
                        >
                            Quản lý tin đăng
                        </Typography>
                        <Typography fontSize={14} lineHeight={1.55} color="rgba(255,255,255,0.45)" sx={{ mt: 1, maxWidth: 540 }}>
                            Theo dõi, chỉnh sửa và kiểm soát tất cả món đồ bạn đang rao bán trên Slife.
                        </Typography>
                    </Box>
                    <Button
                        type="button"
                        onClick={() => navigate('/listings/new')}
                        startIcon={<AddIcon sx={{ fontSize: 20, color: '#fff' }} />}
                        sx={{
                            alignSelf: { xs: 'stretch', sm: 'center' },
                            px: 2.5,
                            py: 1.25,
                            borderRadius: '999px',
                            background: `linear-gradient(135deg, ${STITCH_PURPLE}, ${STITCH_PURPLE_DEEP})`,
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                            textTransform: 'none',
                            whiteSpace: 'nowrap',
                            boxShadow: `0 8px 28px rgba(157, 110, 237, 0.38)`,
                            '&:hover': {
                                boxShadow: `0 10px 36px rgba(157, 110, 237, 0.48)`,
                                background: `linear-gradient(135deg, #B084F0, ${STITCH_PURPLE})`,
                            },
                            '& .MuiButton-startIcon': { mr: 0.75 },
                        }}
                    >
                        Đăng tin mới
                    </Button>
                </Stack>

                <Stack spacing={1.5} sx={{ mb: 2 }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'stretch', md: 'center' }}
                        gap={1.5}
                        sx={{ width: '100%' }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Tìm kiếm tin đăng của bạn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'rgba(255,255,255,0.32)', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                flex: { md: 1 },
                                minWidth: { md: 0 },
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.045)',
                                    borderRadius: '999px',
                                    fontSize: 14,
                                    color: 'rgba(255,255,255,0.9)',
                                    outline: 'none',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' },
                                    '&:hover fieldset': { borderColor: 'rgba(157, 110, 237, 0.4)' },
                                    '&.Mui-focused': {
                                        outline: 'none',
                                        boxShadow: 'none',
                                    },
                                    '&.Mui-focused fieldset': { borderColor: STITCH_PURPLE, borderWidth: 1 },
                                },
                                '& .MuiOutlinedInput-input': {
                                    outline: 'none',
                                    py: 1.1,
                                    '&:focus': { outline: 'none', boxShadow: 'none' },
                                    '&:focus-visible': { outline: 'none' },
                                },
                                '& input': {
                                    color: 'rgba(255,255,255,0.88)',
                                    outline: 'none',
                                },
                                '& input::placeholder': { color: 'rgba(255,255,255,0.26)', opacity: 1 },
                            }}
                        />
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            gap={1.5}
                            sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' } }}
                        >
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 168, md: 188 } }}>
                                <InputLabel id="my-sort-label" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                                    Sắp xếp
                                </InputLabel>
                                <Select
                                    labelId="my-sort-label"
                                    label="Sắp xếp"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    renderValue={(v) => SORT_LABELS[v] ?? v}
                                    sx={selectSx}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value="newest">Mới nhất</MenuItem>
                                    <MenuItem value="oldest">Cũ nhất</MenuItem>
                                    <MenuItem value="price_high">Giá cao → thấp</MenuItem>
                                    <MenuItem value="price_low">Giá thấp → cao</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 168, md: 188 } }}>
                                <InputLabel id="my-cat-label" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                                    Danh mục
                                </InputLabel>
                                <Select
                                    labelId="my-cat-label"
                                    label="Danh mục"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    renderValue={(v) => (v === 'all' ? 'Tất cả' : v)}
                                    sx={selectSx}
                                    MenuProps={menuProps}
                                >
                                    {categoryOptions.map((c) => (
                                        <MenuItem key={c} value={c}>
                                            {c === 'all' ? 'Tất cả' : c}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                    {!isLoading && !error && (
                        <Typography
                            fontSize={13}
                            color="rgba(255,255,255,0.4)"
                            sx={{ textAlign: { xs: 'left', md: 'right' } }}
                        >
                            Hiển thị{' '}
                            <Box component="span" sx={{ color: STITCH_PURPLE, fontWeight: 700 }}>
                                {filteredListings.length}
                            </Box>
                            {totalElements !== filteredListings.length && searchQuery.trim() === '' && categoryFilter === 'all'
                                ? ` / ${totalElements}`
                                : ''}{' '}
                            tin đăng {contextPhrase}
                            {searchQuery.trim() ? ` — lọc theo “${searchQuery.trim()}”` : ''}
                        </Typography>
                    )}
                </Stack>

                <Box sx={{ mb: 3, overflow: 'hidden' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        TabIndicatorProps={{ style: { display: 'none' } }}
                        sx={{
                            minHeight: 48,
                            '& .MuiTabs-flexContainer': { gap: 1.25 },
                            '& .MuiTabScrollButton-root': { color: 'rgba(255,255,255,0.4)' },
                            '& .MuiTab-root': {
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: '-0.01em',
                                minHeight: 44,
                                textTransform: 'none',
                                borderRadius: '999px',
                                px: 2.25,
                                py: 1,
                                transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
                                bgcolor: STITCH_TAB_INACTIVE_BG,
                                border: `1px solid ${STITCH_TAB_INACTIVE_BORDER}`,
                                '&.Mui-selected': {
                                    color: '#fff',
                                    background: STITCH_TAB_ACTIVE_GRADIENT,
                                    bgcolor: 'transparent',
                                    borderColor: STITCH_TAB_ACTIVE_BORDER,
                                    boxShadow: STITCH_TAB_ACTIVE_SHADOW,
                                },
                                '&:hover:not(.Mui-selected)': {
                                    bgcolor: 'rgba(34, 36, 50, 0.98)',
                                    borderColor: 'rgba(255,255,255,0.11)',
                                    color: 'rgba(255,255,255,0.82)',
                                },
                            },
                        }}
                    >
                        {TABS.map(({ value, label }) => {
                            const count = tabCounts[value];
                            const selected = activeTab === value;
                            return (
                                <Tab
                                    key={value}
                                    value={value}
                                    disableRipple
                                    label={(
                                        <Stack
                                            component="span"
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="center"
                                            spacing={1}
                                            sx={{ py: 0.125 }}
                                        >
                                            <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                                                {label}
                                            </Box>
                                            {count !== undefined && (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 26,
                                                        height: 24,
                                                        px: 0.75,
                                                        borderRadius: '10px',
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        lineHeight: 1,
                                                        letterSpacing: '0.02em',
                                                        flexShrink: 0,
                                                        bgcolor: selected
                                                            ? 'rgba(255,255,255,0.22)'
                                                            : 'rgba(255,255,255,0.07)',
                                                        color: selected
                                                            ? '#fff'
                                                            : 'rgba(255,255,255,0.42)',
                                                        border: selected
                                                            ? '1px solid rgba(255,255,255,0.12)'
                                                            : '1px solid rgba(255,255,255,0.06)',
                                                        boxShadow: selected
                                                            ? 'inset 0 1px 0 rgba(255,255,255,0.15)'
                                                            : 'none',
                                                    }}
                                                >
                                                    {count}
                                                </Box>
                                            )}
                                        </Stack>
                                    )}
                                />
                            );
                        })}
                    </Tabs>
                </Box>

                {error ? (
                    <Box sx={{
                        textAlign: 'center', py: 10, borderRadius: '16px',
                        bgcolor: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.18)',
                    }}>
                        <Typography color="#ff4757" fontSize={14}>{error}</Typography>
                    </Box>
                ) : isLoading ? (
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2.5,
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                                lg: 'repeat(4, 1fr)',
                            },
                        }}
                    >
                        {[...Array(8)].map((_, i) => <MyListingsGridCardSkeleton key={i} />)}
                    </Box>
                ) : listings.length === 0 ? (
                    <MyListingsEmptyState tab={activeTab} />
                ) : filteredListings.length === 0 ? (
                    <Box sx={{
                        textAlign: 'center', py: 10, borderRadius: '16px',
                        bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
                    }}>
                        <Typography fontSize={36} sx={{ mb: 1 }}>🔍</Typography>
                        <Typography fontSize={16} fontWeight={600} color="rgba(255,255,255,0.6)" sx={{ mb: 0.5 }}>
                            Không tìm thấy kết quả
                        </Typography>
                        <Typography fontSize={13} color="rgba(255,255,255,0.35)">
                            Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2.5,
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(3, 1fr)',
                                    lg: 'repeat(4, 1fr)',
                                },
                            }}
                        >
                            {filteredListings.map((listing, index) => (
                                <MyListingCard
                                    key={listing.id ?? listing.listingId ?? `listing-${index}`}
                                    listing={listing}
                                    activeTab={activeTab}
                                    onHide={handleHide}
                                    onUnhide={handleUnhide}
                                    onRenew={handleRenew}
                                    onRepost={handleRepost}
                                    onDeleteDraft={handleDeleteDraft}
                                />
                            ))}
                            <MyListingsAddPlaceholder onClick={() => navigate('/listings/new')} />
                        </Box>
                    </>
                )}

                <DeleteDraftDialog
                    open={deleteDialog.open}
                    isDeleting={isDeleting}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                />

                {!isLoading && !error && totalPages > 1 && listings.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <MuiPagination
                            count={totalPages}
                            page={page + 1}
                            onChange={handlePageChange}
                            shape="rounded"
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    color: 'rgba(255,255,255,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    '&.Mui-selected': {
                                        background: `linear-gradient(135deg, ${STITCH_PURPLE}, ${STITCH_PURPLE_DEEP})`,
                                        color: '#fff',
                                        border: 'none',
                                        boxShadow: `0 4px 16px rgba(157, 110, 237, 0.38)`,
                                    },
                                    '&:hover:not(.Mui-selected)': {
                                        bgcolor: 'rgba(157, 110, 237, 0.1)',
                                        borderColor: 'rgba(157, 110, 237, 0.32)',
                                    },
                                },
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
