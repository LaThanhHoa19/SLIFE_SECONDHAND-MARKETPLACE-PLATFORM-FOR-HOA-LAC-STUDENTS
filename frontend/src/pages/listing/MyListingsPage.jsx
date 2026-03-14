/**
 * MyListingsPage — Trang quản lý bài đăng của người dùng.
 * Tabs: Active / Draft / Expired / Reported
 * API: GET /api/listings/my?status=&page=&size=
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Badge,
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    MenuItem,
    Pagination as MuiPagination,
    Select,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    AccessTime as ClockIcon,
    Add as AddIcon,
    Campaign as CampaignIcon,
    CheckCircleOutline as ActiveIcon,
    EditOutlined as EditIcon,
    ErrorOutline as ReportedIcon,
    HourglassEmpty as ExpiredIcon,
    ImageNotSupported as NoImageIcon,
    InfoOutlined as InfoIcon,
    MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyListings } from '../../api/myListingApi';
import { fullImageUrl } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = [
    { value: 'ACTIVE',   label: 'Đang đăng',   icon: <ActiveIcon  sx={{ fontSize: 16 }} /> },
    { value: 'DRAFT',    label: 'Bản nháp',     icon: <EditIcon    sx={{ fontSize: 16 }} /> },
    { value: 'EXPIRED',  label: 'Hết hạn',      icon: <ExpiredIcon sx={{ fontSize: 16 }} /> },
    { value: 'REPORTED', label: 'Bị báo cáo',   icon: <ReportedIcon sx={{ fontSize: 16 }} /> },
];

const STATUS_COLORS = {
    ACTIVE:     { bg: 'rgba(46,213,115,0.15)',  text: '#2ed573' },
    DRAFT:      { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.55)' },
    HIDDEN:     { bg: 'rgba(255,165,0,0.15)',   text: '#ffa500' },
    SOLD:       { bg: 'rgba(157,110,237,0.18)', text: '#9D6EED' },
    GIVEN_AWAY: { bg: 'rgba(157,110,237,0.18)', text: '#9D6EED' },
    BANNED:     { bg: 'rgba(255,71,87,0.15)',   text: '#ff4757' },
    EXPIRED:    { bg: 'rgba(255,165,0,0.12)',   text: '#ffa500' },
};

const STATUS_LABELS = {
    ACTIVE:     'Đang đăng',
    DRAFT:      'Bản nháp',
    HIDDEN:     'Đã ẩn',
    SOLD:       'Đã bán',
    GIVEN_AWAY: 'Đã tặng',
    BANNED:     'Bị khóa',
};

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

// ─── Skeleton card ───────────────────────────────────────────────────────────

function ListingCardSkeleton() {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                borderRadius: '12px',
                bgcolor: '#2A2633',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <Skeleton variant="rounded" width={96} height={96} sx={{ bgcolor: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Skeleton variant="text" width="35%" height={18} sx={{ bgcolor: 'rgba(255,255,255,0.07)', mt: 0.5 }} />
                <Skeleton variant="text" width="45%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.07)', mt: 0.75 }} />
            </Box>
        </Box>
    );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ tab }) {
    const messages = {
        ACTIVE:   { icon: '📭', text: 'Bạn chưa có tin đăng nào đang hoạt động.' },
        DRAFT:    { icon: '📝', text: 'Chưa có bản nháp nào được lưu.' },
        EXPIRED:  { icon: '⏳', text: 'Không có tin đăng nào hết hạn.' },
        REPORTED: { icon: '🛡️', text: 'Không có tin đăng nào bị báo cáo.' },
    };
    const { icon, text } = messages[tab] || { icon: '📭', text: 'Không có dữ liệu.' };
    return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography fontSize={40} sx={{ mb: 1.5 }}>{icon}</Typography>
            <Typography color="rgba(255,255,255,0.45)" fontSize={15}>{text}</Typography>
        </Box>
    );
}

// ─── Single listing row card ──────────────────────────────────────────────────

function MyListingCard({ listing, onEdit, onDelete }) {
    const navigate = useNavigate();
    const id = listing?.id;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const thumb = images[0];
    const statusColor = STATUS_COLORS[listing?.status] || STATUS_COLORS.DRAFT;

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                borderRadius: '12px',
                bgcolor: '#2A2633',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'rgba(157,110,237,0.35)' },
            }}
        >
            {/* Thumbnail */}
            <Box
                onClick={() => navigate(`/listings/${id}`)}
                sx={{
                    width: 96,
                    height: 96,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {thumb ? (
                    <Box
                        component="img"
                        src={fullImageUrl(thumb)}
                        alt={listing?.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <NoImageIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.2)' }} />
                )}
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                    <Typography
                        onClick={() => navigate(`/listings/${id}`)}
                        fontSize={15}
                        fontWeight={600}
                        color="rgba(255,255,255,0.92)"
                        sx={{
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            '&:hover': { color: '#9D6EED' },
                        }}
                    >
                        {listing?.title || 'Không có tiêu đề'}
                    </Typography>

                    {/* Actions — placeholder cho phần Edit/Delete của teammate */}
                    <Stack direction="row" gap={0.5} flexShrink={0}>
                        <Tooltip title="Chỉnh sửa (chức năng đang phát triển)" arrow>
                            <span>
                                <IconButton size="small" disabled sx={{ color: 'rgba(255,255,255,0.3)' }}>
                                    <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Thêm thao tác" arrow>
                            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#9D6EED' } }}>
                                <MoreIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* Price */}
                <Typography fontSize={15} fontWeight={700} color={listing?.isGiveaway ? '#2ed573' : '#FF4757'} sx={{ mt: 0.25 }}>
                    {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
                </Typography>

                {/* Chips row */}
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }}>
                    {/* Status badge */}
                    <Chip
                        size="small"
                        label={STATUS_LABELS[listing?.status] || listing?.status}
                        sx={{
                            height: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: statusColor.bg,
                            color: statusColor.text,
                            border: 'none',
                        }}
                    />

                    {/* Report badge */}
                    {listing?.reportCount > 0 && (
                        <Chip
                            size="small"
                            icon={<ReportedIcon sx={{ fontSize: 12, color: '#ff4757 !important' }} />}
                            label={`${listing.reportCount} báo cáo`}
                            sx={{
                                height: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: 'rgba(255,71,87,0.12)',
                                color: '#ff4757',
                                border: 'none',
                                '& .MuiChip-icon': { ml: '4px' },
                            }}
                        />
                    )}

                    {/* Category */}
                    {listing?.categoryName && (
                        <Chip
                            size="small"
                            label={listing.categoryName}
                            sx={{
                                height: 20,
                                fontSize: 11,
                                bgcolor: 'rgba(255,255,255,0.07)',
                                color: 'rgba(255,255,255,0.55)',
                                border: 'none',
                            }}
                        />
                    )}

                    {/* Expiry */}
                    {listing?.expirationDate && (
                        <Chip
                            size="small"
                            icon={<ClockIcon sx={{ fontSize: 11, color: 'rgba(255,165,0,0.8) !important' }} />}
                            label={`Hết hạn ${formatDate(listing.expirationDate)}`}
                            sx={{
                                height: 20,
                                fontSize: 11,
                                bgcolor: 'rgba(255,165,0,0.1)',
                                color: 'rgba(255,165,0,0.85)',
                                border: 'none',
                                '& .MuiChip-icon': { ml: '4px' },
                            }}
                        />
                    )}
                </Stack>

                {/* Date */}
                <Typography fontSize={12} color="rgba(255,255,255,0.35)" sx={{ mt: 0.5 }}>
                    Đăng {formatDate(listing?.createdAt)}
                </Typography>
            </Box>
        </Box>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyListingsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const tabFromUrl = searchParams.get('status') || 'ACTIVE';
    const pageFromUrl = Math.max(0, Number(searchParams.get('page') || 0));

    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [page, setPage] = useState(pageFromUrl);
    const [listings, setListings] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

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
            const list = Array.isArray(payload?.content) ? payload.content : [];
            setListings(list);
            setTotalPages(payload?.totalPages ?? 1);
            setTotalElements(payload?.totalElements ?? list.length);
        } catch (err) {
            if (err?.name === 'CanceledError' || ctrl.signal.aborted) return;
            setError('Không thể tải danh sách bài đăng. Vui lòng thử lại.');
        } finally {
            if (!ctrl.signal.aborted) setLoading(false);
        }
    }, []);

    // Sync URL params → fetch
    useEffect(() => {
        fetchListings(activeTab, page);
    }, [activeTab, page, fetchListings]);

    const handleTabChange = (_, newTab) => {
        setActiveTab(newTab);
        setPage(0);
        setSearchParams({ status: newTab, page: '0' });
    };

    const handlePageChange = (_, newPage) => {
        const pg = newPage - 1; // MUI Pagination is 1-indexed
        setPage(pg);
        setSearchParams({ status: activeTab, page: String(pg) });
    };

    return (
        <Box sx={{ maxWidth: 760, mx: 'auto', px: { xs: 1.5, sm: 2 }, py: 3 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Box>
                    <Typography fontSize={22} fontWeight={700} color="#fff">
                        Tin đăng của tôi
                    </Typography>
                    <Typography fontSize={13} color="rgba(255,255,255,0.4)" sx={{ mt: 0.25 }}>
                        Quản lý tất cả bài đăng mua bán của bạn
                    </Typography>
                </Box>
                <Tooltip title="Đăng tin mới" arrow>
                    <Box
                        onClick={() => navigate('/listings/new')}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 2,
                            py: 1,
                            borderRadius: '10px',
                            bgcolor: '#9D6EED',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#8A5AD4' },
                            transition: 'background 0.15s',
                        }}
                    >
                        <AddIcon sx={{ fontSize: 18, color: '#fff' }} />
                        <Typography fontSize={13} fontWeight={600} color="#fff">
                            Đăng tin
                        </Typography>
                    </Box>
                </Tooltip>
            </Stack>

            {/* Tabs */}
            <Box
                sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    mb: 2.5,
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    TabIndicatorProps={{ style: { backgroundColor: '#9D6EED' } }}
                    sx={{
                        '& .MuiTab-root': {
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: 13,
                            fontWeight: 500,
                            minHeight: 44,
                            textTransform: 'none',
                            '&.Mui-selected': { color: '#9D6EED', fontWeight: 600 },
                        },
                    }}
                >
                    {TABS.map(({ value, label, icon }) => (
                        <Tab
                            key={value}
                            value={value}
                            label={
                                <Stack direction="row" alignItems="center" gap={0.6}>
                                    {icon}
                                    {label}
                                </Stack>
                            }
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Count line */}
            {!isLoading && !error && (
                <Typography fontSize={13} color="rgba(255,255,255,0.35)" sx={{ mb: 2 }}>
                    {totalElements > 0
                        ? `${totalElements} bài đăng`
                        : ''}
                </Typography>
            )}

            {/* Content */}
            {error ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="#ff4757" fontSize={14}>{error}</Typography>
                </Box>
            ) : isLoading ? (
                <Stack gap={1.5}>
                    {[...Array(5)].map((_, i) => <ListingCardSkeleton key={i} />)}
                </Stack>
            ) : listings.length === 0 ? (
                <EmptyState tab={activeTab} />
            ) : (
                <Stack gap={1.5}>
                    {listings.map((listing) => (
                        <MyListingCard key={listing.id} listing={listing} />
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <MuiPagination
                        count={totalPages}
                        page={page + 1}
                        onChange={handlePageChange}
                        shape="rounded"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: 'rgba(255,255,255,0.55)',
                                borderColor: 'rgba(255,255,255,0.12)',
                                '&.Mui-selected': {
                                    bgcolor: '#9D6EED',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#8A5AD4' },
                                },
                                '&:hover': { bgcolor: 'rgba(157,110,237,0.12)' },
                            },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}
