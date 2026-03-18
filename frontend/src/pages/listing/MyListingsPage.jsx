/**
 * MyListingsPage — Trang quản lý bài đăng của người dùng.
 * Tabs: Active / Draft / Expired / Reported
 * API: GET /api/listings/my?status=&page=&size=
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    InputAdornment,
    Pagination as MuiPagination,
    Skeleton,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    AccessTime as ClockIcon,
    Add as AddIcon,
    Autorenew as RenewIcon,
    Block as RejectedIcon,
    CheckCircleOutline as ActiveIcon,
    DeleteOutline as DeleteIcon,
    EditOutlined as EditIcon,
    ErrorOutline as ReportedIcon,
    HourglassEmpty as ExpiredIcon,
    ImageNotSupported as NoImageIcon,
    LocationOn as LocationIcon,
    Replay as RepostIcon,
    Schedule as PendingIcon,
    Search as SearchIcon,
    Visibility as UnhideIcon,
    VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deleteDraft, getMyListings, hideListing, renewListing, repostListing, unhideListing } from '../../api/myListingApi';
import { fullImageUrl } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
    { value: 'ACTIVE',   label: 'Đang đăng',   icon: <ActiveIcon   sx={{ fontSize: 14 }} /> },
    { value: 'HIDDEN',   label: 'Đã ẩn',        icon: <HideIcon     sx={{ fontSize: 14 }} /> },
    { value: 'DRAFT',    label: 'Bản nháp',     icon: <EditIcon     sx={{ fontSize: 14 }} /> },
    { value: 'EXPIRED',  label: 'Hết hạn',      icon: <ExpiredIcon  sx={{ fontSize: 14 }} /> },
    { value: 'PENDING',  label: 'Chờ duyệt',    icon: <PendingIcon  sx={{ fontSize: 14 }} /> },
    { value: 'REJECTED', label: 'Bị từ chối',   icon: <RejectedIcon sx={{ fontSize: 14 }} /> },
    { value: 'REPORTED', label: 'Bị báo cáo',   icon: <ReportedIcon sx={{ fontSize: 14 }} /> },
];

const ALL_TAB_STATUSES = TABS.map(t => t.value);

const STATUS_COLORS = {
    ACTIVE:     { bg: 'rgba(46,213,115,0.12)',  text: '#2ed573',  border: 'rgba(46,213,115,0.3)' },
    DRAFT:      { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.15)' },
    HIDDEN:     { bg: 'rgba(255,165,0,0.12)',   text: '#ffa500',  border: 'rgba(255,165,0,0.3)' },
    SOLD:       { bg: 'rgba(157,110,237,0.15)', text: '#9D6EED',  border: 'rgba(157,110,237,0.35)' },
    GIVEN_AWAY: { bg: 'rgba(157,110,237,0.15)', text: '#9D6EED',  border: 'rgba(157,110,237,0.35)' },
    BANNED:     { bg: 'rgba(255,71,87,0.12)',   text: '#ff4757',  border: 'rgba(255,71,87,0.3)' },
    EXPIRED:    { bg: 'rgba(255,165,0,0.1)',    text: '#ffa500',  border: 'rgba(255,165,0,0.25)' },
    PENDING:    { bg: 'rgba(255,214,0,0.1)',    text: '#ffd700',  border: 'rgba(255,214,0,0.28)' },
    REJECTED:   { bg: 'rgba(255,71,87,0.1)',    text: '#ff4757',  border: 'rgba(255,71,87,0.25)' },
};

const STATUS_LABELS = {
    ACTIVE:     'Đang đăng',
    DRAFT:      'Bản nháp',
    HIDDEN:     'Đã ẩn',
    SOLD:       'Đã bán',
    GIVEN_AWAY: 'Đã tặng',
    BANNED:     'Bị khóa',
    PENDING:    'Chờ duyệt',
    REJECTED:   'Bị từ chối',
};

const PAGE_SIZE = 10;

const toCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

/** Trả về true nếu listing còn trong vòng 7 ngày trước khi hết hạn (chưa expired). */
const isRenewable = (expirationDate) => {
    if (!expirationDate) return false;
    const now = Date.now();
    const expiry = new Date(expirationDate).getTime();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ListingCardSkeleton() {
    return (
        <Box sx={{
            display: 'flex',
            gap: 2.5,
            p: 2.5,
            borderRadius: '14px',
            bgcolor: '#262130',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <Skeleton
                variant="rounded"
                width={112} height={112}
                sx={{ bgcolor: 'rgba(255,255,255,0.07)', flexShrink: 0, borderRadius: '10px' }}
            />
            <Box sx={{ flex: 1, pt: 0.5 }}>
                <Skeleton variant="text" width="55%" height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.07)', mt: 0.75 }} />
                <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                    <Skeleton variant="rounded" width={72} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '20px' }} />
                    <Skeleton variant="rounded" width={88} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '20px' }} />
                </Stack>
                <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mt: 1 }} />
            </Box>
        </Box>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }) {
    const messages = {
        ACTIVE:   { icon: '📭', title: 'Chưa có tin đăng',       text: 'Bạn chưa có tin đăng nào đang hoạt động.' },
        HIDDEN:   { icon: '👁️', title: 'Không có tin đã ẩn',      text: 'Bạn chưa ẩn bài đăng nào.' },
        DRAFT:    { icon: '📝', title: 'Không có bản nháp',       text: 'Chưa có bản nháp nào được lưu lại.' },
        EXPIRED:  { icon: '⏳', title: 'Không có tin hết hạn',    text: 'Tất cả tin đăng của bạn vẫn còn hiệu lực.' },
        PENDING:  { icon: '⏰', title: 'Không có tin chờ duyệt',  text: 'Không có bài đăng nào đang chờ được duyệt.' },
        REJECTED: { icon: '🚫', title: 'Không có tin bị từ chối', text: 'Không có bài đăng nào bị từ chối đăng.' },
        REPORTED: { icon: '🛡️', title: 'Không bị báo cáo',        text: 'Tin đăng của bạn chưa bị báo cáo nào.' },
    };
    const { icon, title, text } = messages[tab] || { icon: '📭', title: 'Trống', text: 'Không có dữ liệu.' };
    return (
        <Box sx={{
            textAlign: 'center',
            py: 9,
            px: 3,
            borderRadius: '16px',
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
        }}>
            <Typography fontSize={44} sx={{ mb: 1.5, lineHeight: 1 }}>{icon}</Typography>
            <Typography fontSize={16} fontWeight={600} color="rgba(255,255,255,0.7)" sx={{ mb: 0.75 }}>
                {title}
            </Typography>
            <Typography fontSize={13.5} color="rgba(255,255,255,0.38)">{text}</Typography>
        </Box>
    );
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function ActionButton({ icon, label, onClick, color, borderColor, bgColor, hoverBg, disabled }) {
    return (
        <Box
            onClick={disabled ? undefined : onClick}
            sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.25, py: 0.4,
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                bgcolor: bgColor,
                cursor: disabled ? 'default' : 'pointer',
                userSelect: 'none',
                opacity: disabled ? 0.5 : 1,
                transition: 'background 0.15s, border-color 0.15s',
                '&:hover': disabled ? {} : { bgcolor: hoverBg, borderColor: color },
            }}
        >
            {icon}
            <Typography fontSize={11.5} fontWeight={600} color={color}>{label}</Typography>
        </Box>
    );
}

function MyListingCard({ listing, activeTab, onHide, onUnhide, onRenew, onRepost, onDeleteDraft }) {
    const navigate = useNavigate();
    const id = listing?.id;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const thumb = images[0];
    const statusColor = STATUS_COLORS[listing?.status] || STATUS_COLORS.DRAFT;

    return (
        <Box sx={{
            display: 'flex',
            gap: 2.5,
            p: 2.5,
            borderRadius: '14px',
            bgcolor: '#262130',
            border: '1px solid rgba(255,255,255,0.07)',
            transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
            '&:hover': {
                borderColor: 'rgba(157,110,237,0.4)',
                boxShadow: '0 4px 24px rgba(157,110,237,0.1)',
                transform: 'translateY(-1px)',
            },
        }}>

            {/* ── Thumbnail với khung viền ── */}
            <Box
                onClick={() => navigate(`/listings/${id}`)}
                sx={{
                    width: 112,
                    height: 112,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '2px solid rgba(157,110,237,0.22)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        borderColor: '#9D6EED',
                        boxShadow: '0 4px 18px rgba(157,110,237,0.3)',
                    },
                }}
            >
                {thumb ? (
                    <Box
                        component="img"
                        src={fullImageUrl(thumb)}
                        alt={listing?.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                ) : (
                    <Box sx={{ textAlign: 'center' }}>
                        <NoImageIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.18)' }} />
                        <Typography fontSize={10} color="rgba(255,255,255,0.2)" sx={{ mt: 0.5 }}>
                            Chưa có ảnh
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Nội dung ── */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}>

                {/* Tiêu đề + Actions */}
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
                            lineHeight: 1.4,
                            transition: 'color 0.15s',
                            '&:hover': { color: '#9D6EED' },
                        }}
                    >
                        {listing?.title || 'Không có tiêu đề'}
                    </Typography>

                    <Stack direction="row" gap={0.75} flexShrink={0} alignItems="center" sx={{ mt: '-2px' }}>
                        {activeTab === 'ACTIVE' && (
                            <>
                                {isRenewable(listing?.expirationDate) && (
                                    <Tooltip title="Gia hạn thêm 15 ngày (chỉ khả dụng trong 7 ngày cuối)" arrow>
                                        <ActionButton
                                            icon={<RenewIcon sx={{ fontSize: 12, color: '#2ed573' }} />}
                                            label="Gia hạn"
                                            onClick={() => onRenew(id)}
                                            color="#2ed573"
                                            borderColor="rgba(46,213,115,0.35)"
                                            bgColor="rgba(46,213,115,0.08)"
                                            hoverBg="rgba(46,213,115,0.16)"
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip title="Ẩn tin — bài đăng sẽ không hiển thị với người khác" arrow>
                                    <ActionButton
                                        icon={<HideIcon sx={{ fontSize: 12, color: '#ffa500' }} />}
                                        label="Ẩn tin"
                                        onClick={() => onHide(id)}
                                        color="#ffa500"
                                        borderColor="rgba(255,165,0,0.35)"
                                        bgColor="rgba(255,165,0,0.08)"
                                        hoverBg="rgba(255,165,0,0.16)"
                                    />
                                </Tooltip>
                                <Tooltip title="Chỉnh sửa (đang phát triển)" arrow>
                                    <span>
                                        <IconButton size="small" disabled sx={{ color: 'rgba(255,255,255,0.2)', p: '4px' }}>
                                            <EditIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </>
                        )}

                        {activeTab === 'DRAFT' && (
                            <>
                                <Tooltip title="Tiếp tục chỉnh sửa và đăng bài" arrow>
                                    <ActionButton
                                        icon={<EditIcon sx={{ fontSize: 12, color: '#9D6EED' }} />}
                                        label="Chỉnh sửa &amp; Đăng"
                                        onClick={() => navigate('/listings/new')}
                                        color="#9D6EED"
                                        borderColor="rgba(157,110,237,0.35)"
                                        bgColor="rgba(157,110,237,0.1)"
                                        hoverBg="rgba(157,110,237,0.2)"
                                    />
                                </Tooltip>
                                <Tooltip title="Xóa bản nháp này vĩnh viễn" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDeleteDraft(id)}
                                        sx={{
                                            p: '4px',
                                            color: '#ff4757',
                                            border: '1px solid rgba(255,71,87,0.3)',
                                            borderRadius: '8px',
                                            bgcolor: 'rgba(255,71,87,0.06)',
                                            transition: 'background 0.15s, border-color 0.15s',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,71,87,0.16)',
                                                borderColor: '#ff4757',
                                            },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}

                        {activeTab === 'EXPIRED' && (
                            <Tooltip title="Đăng lại — tin sẽ hiển thị công khai trong 30 ngày" arrow>
                                <ActionButton
                                    icon={<RepostIcon sx={{ fontSize: 12, color: '#9D6EED' }} />}
                                    label="Đăng lại"
                                    onClick={() => onRepost(id)}
                                    color="#9D6EED"
                                    borderColor="rgba(157,110,237,0.35)"
                                    bgColor="rgba(157,110,237,0.08)"
                                    hoverBg="rgba(157,110,237,0.18)"
                                />
                            </Tooltip>
                        )}

                        {activeTab === 'HIDDEN' && (
                            <Tooltip title="Hiển thị lại bài đăng cho mọi người" arrow>
                                <ActionButton
                                    icon={<UnhideIcon sx={{ fontSize: 12, color: '#2ed573' }} />}
                                    label="Hiển thị lại"
                                    onClick={() => onUnhide(id)}
                                    color="#2ed573"
                                    borderColor="rgba(46,213,115,0.35)"
                                    bgColor="rgba(46,213,115,0.08)"
                                    hoverBg="rgba(46,213,115,0.16)"
                                />
                            </Tooltip>
                        )}

                        {(activeTab === 'PENDING' || activeTab === 'REJECTED' || activeTab === 'REPORTED') && (
                            <Tooltip title="Chỉnh sửa (đang phát triển)" arrow>
                                <span>
                                    <IconButton size="small" disabled sx={{ color: 'rgba(255,255,255,0.2)', p: '4px' }}>
                                        <EditIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>

                {/* Giá */}
                <Typography
                    fontSize={16}
                    fontWeight={700}
                    color={listing?.isGiveaway ? '#2ed573' : '#FF4757'}
                    sx={{ lineHeight: 1 }}
                >
                    {listing?.isGiveaway ? '🎁 Cho tặng miễn phí' : toCurrency(listing?.price)}
                </Typography>

                {/* Badges */}
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.25 }}>
                    {/* Status */}
                    <Chip
                        size="small"
                        label={STATUS_LABELS[listing?.status] || listing?.status}
                        sx={{
                            height: 22,
                            fontSize: 11.5,
                            fontWeight: 600,
                            bgcolor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                            borderRadius: '20px',
                            px: 0.25,
                        }}
                    />

                    {/* Report */}
                    {listing?.reportCount > 0 && (
                        <Chip
                            size="small"
                            icon={<ReportedIcon sx={{ fontSize: 11, color: '#ff4757 !important' }} />}
                            label={`${listing.reportCount} báo cáo`}
                            sx={{
                                height: 22,
                                fontSize: 11.5,
                                fontWeight: 600,
                                bgcolor: 'rgba(255,71,87,0.1)',
                                color: '#ff4757',
                                border: '1px solid rgba(255,71,87,0.28)',
                                borderRadius: '20px',
                                px: 0.25,
                                '& .MuiChip-icon': { ml: '5px' },
                            }}
                        />
                    )}

                    {/* Category */}
                    {listing?.categoryName && (
                        <Chip
                            size="small"
                            label={listing.categoryName}
                            sx={{
                                height: 22,
                                fontSize: 11.5,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                px: 0.25,
                            }}
                        />
                    )}

                    {/* Expiry */}
                    {listing?.expirationDate && (
                        <Chip
                            size="small"
                            icon={<ClockIcon sx={{ fontSize: 11, color: '#ffa500 !important' }} />}
                            label={`Hết hạn ${formatDate(listing.expirationDate)}`}
                            sx={{
                                height: 22,
                                fontSize: 11.5,
                                bgcolor: 'rgba(255,165,0,0.08)',
                                color: 'rgba(255,165,0,0.9)',
                                border: '1px solid rgba(255,165,0,0.22)',
                                borderRadius: '20px',
                                px: 0.25,
                                '& .MuiChip-icon': { ml: '5px' },
                            }}
                        />
                    )}
                </Stack>

                {/* Vị trí + Ngày đăng */}
                <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mt: 'auto', pt: 0.5 }}>
                    {listing?.location && (
                        <Stack direction="row" alignItems="center" gap={0.4}>
                            <LocationIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }} />
                            <Typography fontSize={12} color="rgba(255,255,255,0.28)"
                                sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {listing.location}
                            </Typography>
                        </Stack>
                    )}
                    <Stack direction="row" alignItems="center" gap={0.4}>
                        <ClockIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }} />
                        <Typography fontSize={12} color="rgba(255,255,255,0.28)">
                            {formatDate(listing?.createdAt)}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyListingsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const tabFromUrl  = searchParams.get('status') || 'ACTIVE';
    const pageFromUrl = Math.max(0, Number(searchParams.get('page') || 0));

    const [activeTab,      setActiveTab]      = useState(tabFromUrl);
    const [page,           setPage]           = useState(pageFromUrl);
    const [listings,       setListings]       = useState([]);
    const [totalPages,     setTotalPages]     = useState(1);
    const [totalElements,  setTotalElements]  = useState(0);
    const [isLoading,      setLoading]        = useState(false);
    const [error,          setError]          = useState(null);
    const [snackbar,       setSnackbar]       = useState({ open: false, message: '', severity: 'info' });
    const [tabCounts,      setTabCounts]      = useState({});
    const [searchQuery,    setSearchQuery]    = useState('');
    const [deleteDialog,   setDeleteDialog]   = useState({ open: false, listingId: null });
    const [isDeleting,     setIsDeleting]     = useState(false);
    const abortRef = useRef(null);

    const showSnackbar = (message, severity = 'info') =>
        setSnackbar({ open: true, message, severity });

    // Fetch count cho tất cả tabs song song (dùng size=1 để lấy totalElements)
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
            setError('Không thể tải danh sách bài đăng. Vui lòng thử lại.');
        } finally {
            if (!ctrl.signal.aborted) setLoading(false);
        }
    }, []);

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

            {/* ── Header ── */}
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

                <Box
                    onClick={() => navigate('/listings/new')}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 2.25,
                        py: 1.1,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #9D6EED, #7B4FBF)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(157,110,237,0.35)',
                        transition: 'opacity 0.15s, box-shadow 0.15s',
                        '&:hover': {
                            opacity: 0.9,
                            boxShadow: '0 6px 18px rgba(157,110,237,0.45)',
                        },
                    }}
                >
                    <AddIcon sx={{ fontSize: 17, color: '#fff' }} />
                    <Typography fontSize={13} fontWeight={600} color="#fff">
                        Đăng tin mới
                    </Typography>
                </Box>
            </Stack>

            {/* ── Search ── */}
            <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm trong tin đăng của tôi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
                        </InputAdornment>
                    ),
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

            {/* ── Tabs ── */}
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

            {/* ── Count + search result info ── */}
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
                                — tìm thấy {filteredListings.length} kết quả cho &quot;{searchQuery}&quot;
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            )}

            {/* ── Nội dung ── */}
            {error ? (
                <Box sx={{
                    textAlign: 'center', py: 7, borderRadius: '14px',
                    bgcolor: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.18)',
                }}>
                    <Typography color="#ff4757" fontSize={14}>{error}</Typography>
                </Box>
            ) : isLoading ? (
                <Stack gap={2}>
                    {[...Array(4)].map((_, i) => <ListingCardSkeleton key={i} />)}
                </Stack>
            ) : listings.length === 0 ? (
                <EmptyState tab={activeTab} />
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
                    {filteredListings.map((listing) => (
                        <MyListingCard
                            key={listing.id}
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

            {/* ── Delete Draft Confirm Dialog ── */}
            <Dialog
                open={deleteDialog.open}
                onClose={handleCancelDelete}
                PaperProps={{
                    sx: {
                        bgcolor: '#1e1a2e',
                        border: '1px solid rgba(255,71,87,0.25)',
                        borderRadius: '16px',
                        px: 0.5,
                        minWidth: 340,
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                    <Box sx={{
                        width: 36, height: 36,
                        borderRadius: '10px',
                        bgcolor: 'rgba(255,71,87,0.12)',
                        border: '1px solid rgba(255,71,87,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <DeleteIcon sx={{ fontSize: 18, color: '#ff4757' }} />
                    </Box>
                    <Typography fontSize={16} fontWeight={700} color="rgba(255,255,255,0.9)">
                        Xóa bản nháp
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ pt: 0.5 }}>
                    <DialogContentText sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>
                        Bạn có chắc chắn muốn xóa bản nháp này?{' '}
                        <Box component="span" sx={{ color: '#ff4757', fontWeight: 600 }}>
                            Hành động này không thể hoàn tác.
                        </Box>
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                        sx={{
                            flex: 1,
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: 13,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        sx={{
                            flex: 1,
                            borderRadius: '10px',
                            bgcolor: '#ff4757',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#e03040' },
                            '&:disabled': { bgcolor: 'rgba(255,71,87,0.4)', color: 'rgba(255,255,255,0.5)' },
                        }}
                        variant="contained"
                        disableElevation
                    >
                        {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Snackbar feedback ── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    sx={{ borderRadius: '10px', fontWeight: 500 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* ── Pagination ── */}
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
