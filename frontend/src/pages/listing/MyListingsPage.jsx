/**
 * MyListingsPage — Trang quản lý bài đăng của người dùng.
 * Tabs: ACTIVE, HIDDEN, DRAFT, EXPIRED, PENDING, REJECTED, REPORTED
 * API: GET /api/listings/my?status=&page=&size=
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    InputAdornment,
    Pagination as MuiPagination,
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
import MyListingsEmptyState from './myListings/MyListingsEmptyState';
import MyListingsRowSkeleton from './myListings/MyListingsRowSkeleton';
import {
    ALL_TAB_STATUSES,
    pageFromSearchParams,
    PAGE_SIZE,
    TABS,
    tabFromSearchParams,
} from './myListings/myListingsConfig';

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
        try {
            await repostListing(id);
            showSnackbar('Đã đăng lại thành công! Tin sẽ hiển thị trong 30 ngày.', 'success');
            fetchTabCounts();
            fetchListings(activeTab, page);
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
        setSearchParams({ status: newTab, page: '0' });
    };

    const handlePageChange = (_, newPage) => {
        const pg = newPage - 1;
        setPage(pg);
        setSearchParams({ status: activeTab, page: String(pg) });
    };

    const filteredListings = searchQuery.trim()
        ? listings.filter(l =>
            l.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            l.location?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
        : listings;

    return (
        <Box sx={{ maxWidth: 780, mx: 'auto', px: { xs: 1.5, sm: 2.5 }, py: 3.5 }}>

            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    mb: 3.5,
                    pb: 3,
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <Box>
                    <Typography fontSize={23} fontWeight={700} color="#fff" sx={{ lineHeight: 1.2 }}>
                        Tin đăng của tôi
                    </Typography>
                    <Typography fontSize={13} color="rgba(255,255,255,0.38)" sx={{ mt: 0.5 }}>
                        Quản lý tất cả bài đăng mua bán của bạn
                    </Typography>
                </Box>

                <Button
                    type="button"
                    onClick={() => navigate('/listings/new')}
                    startIcon={<AddIcon sx={{ fontSize: 17, color: '#fff' }} />}
                    sx={{
                        px: 2.25,
                        py: 1.1,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #9D6EED, #7B4FBF)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(157,110,237,0.35)',
                        transition: 'opacity 0.15s, box-shadow 0.15s',
                        '&:hover': {
                            opacity: 0.9,
                            boxShadow: '0 6px 18px rgba(157,110,237,0.45)',
                            background: 'linear-gradient(135deg, #9D6EED, #7B4FBF)',
                        },
                        '& .MuiButton-startIcon': { mr: 0.25, ml: 0 },
                    }}
                >
                    Đăng tin mới
                </Button>
            </Stack>

            <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm trong tin đăng của tôi..."
                helperText="Chỉ lọc theo tiêu đề và vị trí trên trang hiện tại."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
                        </InputAdornment>
                    ),
                }}
                FormHelperTextProps={{
                    sx: { color: 'rgba(255,255,255,0.35)', mt: 0.75, mx: 0 },
                }}
                sx={{
                    mb: 2.5,
                    '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.04)',
                        borderRadius: '10px',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(157,110,237,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#9D6EED', borderWidth: 1.5 },
                    },
                    '& input': { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
                    '& input::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
                }}
            />

            <Box
                sx={{
                    bgcolor: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    mb: 3,
                    overflow: 'hidden',
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    TabIndicatorProps={{ style: { display: 'none' } }}
                    sx={{
                        minHeight: 46,
                        '& .MuiTabs-flexContainer': { gap: 0 },
                        '& .MuiTabScrollButton-root': {
                            color: 'rgba(255,255,255,0.4)',
                            '&.Mui-disabled': { opacity: 0.2 },
                        },
                        '& .MuiTab-root': {
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: 12,
                            fontWeight: 500,
                            minHeight: 46,
                            minWidth: 'auto',
                            px: 1.75,
                            textTransform: 'none',
                            borderRadius: 0,
                            transition: 'background 0.15s, color 0.15s',
                            '&:not(:last-child)': {
                                borderRight: '1px solid rgba(255,255,255,0.06)',
                            },
                            '&:hover:not(.Mui-selected)': {
                                bgcolor: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.65)',
                            },
                            '&.Mui-selected': {
                                color: '#9D6EED',
                                fontWeight: 700,
                                bgcolor: 'rgba(157,110,237,0.12)',
                            },
                        },
                    }}
                >
                    {TABS.map(({ value, label, icon }) => {
                        const count = tabCounts[value];
                        return (
                            <Tab
                                key={value}
                                value={value}
                                label={
                                    <Stack direction="row" alignItems="center" gap={0.6}>
                                        {icon}
                                        <span>
                                            {label}
                                            {count !== undefined && (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        ml: 0.6,
                                                        px: 0.7,
                                                        py: '1px',
                                                        borderRadius: '20px',
                                                        fontSize: 10.5,
                                                        fontWeight: 700,
                                                        bgcolor: value === activeTab
                                                            ? 'rgba(157,110,237,0.25)'
                                                            : 'rgba(255,255,255,0.1)',
                                                        color: value === activeTab ? '#9D6EED' : 'rgba(255,255,255,0.5)',
                                                        lineHeight: 1.6,
                                                        display: 'inline-block',
                                                        verticalAlign: 'middle',
                                                    }}
                                                >
                                                    {count}
                                                </Box>
                                            )}
                                        </span>
                                    </Stack>
                                }
                            />
                        );
                    })}
                </Tabs>
            </Box>

            {!isLoading && !error && (totalElements > 0 || searchQuery.trim()) && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Box sx={{
                            px: 1.25, py: 0.25,
                            borderRadius: '20px',
                            bgcolor: 'rgba(157,110,237,0.15)',
                            border: '1px solid rgba(157,110,237,0.25)',
                        }}>
                            <Typography fontSize={12} fontWeight={600} color="#9D6EED">
                                {totalElements} bài đăng
                            </Typography>
                        </Box>
                        {searchQuery.trim() && (
                            <Typography fontSize={12} color="rgba(255,255,255,0.38)">
                                — trên trang này: {filteredListings.length} kết quả cho &quot;{searchQuery}&quot;
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            )}

            {error ? (
                <Box sx={{
                    textAlign: 'center', py: 7, borderRadius: '14px',
                    bgcolor: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.18)',
                }}>
                    <Typography color="#ff4757" fontSize={14}>{error}</Typography>
                </Box>
            ) : isLoading ? (
                <Stack gap={2}>
                    {[...Array(4)].map((_, i) => <MyListingsRowSkeleton key={i} />)}
                </Stack>
            ) : listings.length === 0 ? (
                <MyListingsEmptyState tab={activeTab} />
            ) : filteredListings.length === 0 ? (
                <Box sx={{
                    textAlign: 'center', py: 7, borderRadius: '14px',
                    bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
                }}>
                    <Typography fontSize={36} sx={{ mb: 1 }}>🔍</Typography>
                    <Typography fontSize={15} fontWeight={600} color="rgba(255,255,255,0.6)" sx={{ mb: 0.5 }}>
                        Không tìm thấy kết quả
                    </Typography>
                    <Typography fontSize={13} color="rgba(255,255,255,0.35)">
                        Không có bài đăng nào khớp với &quot;{searchQuery}&quot;
                    </Typography>
                </Box>
            ) : (
                <Stack gap={2}>
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
                </Stack>
            )}

            <DeleteDraftDialog
                open={deleteDialog.open}
                isDeleting={isDeleting}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            />

            {!isLoading && !error && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4.5 }}>
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
                                    background: 'linear-gradient(135deg, #9D6EED, #7B4FBF)',
                                    color: '#fff',
                                    border: 'none',
                                    boxShadow: '0 2px 10px rgba(157,110,237,0.4)',
                                    '&:hover': { opacity: 0.88 },
                                },
                                '&:hover:not(.Mui-selected)': {
                                    bgcolor: 'rgba(157,110,237,0.1)',
                                    borderColor: 'rgba(157,110,237,0.3)',
                                },
                            },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}
