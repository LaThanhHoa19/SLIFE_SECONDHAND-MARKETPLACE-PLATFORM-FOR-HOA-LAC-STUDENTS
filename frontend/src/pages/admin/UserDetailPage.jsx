/**
 * UserDetailPage — Admin xem chi tiết người dùng + danh sách tin đăng.
 * API:
 *   - GET /api/users/{id}          → thông tin user (getUserById)
 *   - GET /api/listings?sellerId=  → danh sách tin đăng công khai (getListings)
 * Không thay đổi backend.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import StarIcon from '@mui/icons-material/Star';
import ReportIcon from '@mui/icons-material/Report';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getUserById } from '../../api/userApi';
import { getListings } from '../../api/listingApi';

const PAGE_SIZE = 12;

const SURFACE = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';
const PURPLE = '#A78BFA';

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
}

function formatPrice(price, isGiveaway) {
  if (isGiveaway) return 'Cho tặng';
  if (!price && price !== 0) return '—';
  return Number(price).toLocaleString('vi-VN') + ' ₫';
}

function statusColor(status) {
  switch (status) {
    case 'ACTIVE': return { bg: 'rgba(22,163,74,0.12)', color: '#16a34a' };
    case 'BANNED': return { bg: 'rgba(220,38,38,0.12)', color: '#b91c1c' };
    case 'RESTRICTED': return { bg: 'rgba(234,179,8,0.12)', color: '#ca8a04' };
    default: return { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
  }
}

function listingStatusColor(status) {
  switch (status) {
    case 'ACTIVE': return '#16a34a';
    case 'HIDDEN':
    case 'MOD_HIDDEN': return '#ca8a04';
    case 'SOLD': return '#3b82f6';
    case 'EXPIRED': return '#6b7280';
    case 'DRAFT': return '#8b5cf6';
    default: return '#94a3b8';
  }
}

/* ─── Info row ─── */
function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ py: 1, borderBottom: `1px solid ${BORDER}` }}>
      <Box sx={{ color: PURPLE, mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>{value ?? '—'}</Typography>
      </Box>
    </Stack>
  );
}

const CONDITION_LABEL = {
  NEW: 'Mới',
  USED_LIKE_NEW: 'Như mới',
  USED_GOOD: 'Đã dùng - tốt',
  USED_FAIR: 'Đã dùng - khá',
};

/* ─── Listing card (horizontal) ─── */
function ListingCard({ listing }) {
  const image = listing.imageUrls?.[0] ?? listing.thumbnailUrl ?? null;
  const status = listing.status ?? 'ACTIVE';
  const condition = CONDITION_LABEL[listing.itemCondition] ?? listing.itemCondition ?? null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        bgcolor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        overflow: 'hidden',
        color: '#fff',
        height: 120, // Đặt chiều cao cố định để không bị ảnh kéo giãn
      }}
    >
      {/* Thumbnail */}
      <Box sx={{ flexShrink: 0, width: 130, alignSelf: 'stretch' }}>
        {image ? (
          <Box
            component="img"
            src={image}
            alt={listing.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', minHeight: 100, bgcolor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: 28, color: 'rgba(255,255,255,0.25)' }}>📦</Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, px: 2, py: 1.5, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        {/* Title + status */}
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Chip
            label={status}
            size="small"
            sx={{ fontSize: 10, fontWeight: 700, borderRadius: 999, bgcolor: `${listingStatusColor(status)}22`, color: listingStatusColor(status), flexShrink: 0 }}
          />
          {condition && (
            <Chip
              label={condition}
              size="small"
              icon={<InfoOutlinedIcon sx={{ fontSize: '12px !important' }} />}
              sx={{ fontSize: 10, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', flexShrink: 0 }}
            />
          )}
        </Stack>

        <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {listing.title}
        </Typography>

        <Typography variant="body2" sx={{ color: PURPLE, fontWeight: 700 }}>
          {formatPrice(listing.price, listing.isGiveaway)}
        </Typography>

        {/* Location + date */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {listing.location && (
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <LocationOnIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{listing.location}</Typography>
            </Stack>
          )}
          {listing.createdAt && (
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <CalendarTodayIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{formatDate(listing.createdAt)}</Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

/* ─── Main Page ─── */
export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [activeTab, setActiveTab] = useState('ACTIVE');

  /* Fetch user info */
  useEffect(() => {
    if (!id) return;
    setUserLoading(true);
    setUserError('');
    getUserById(id)
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        setUser(data);
      })
      .catch((err) => setUserError(err?.message || 'Không tải được thông tin người dùng.'))
      .finally(() => setUserLoading(false));
  }, [id]);

  /* Fetch listings */
  const fetchListings = useCallback(async (sellerId, pg, status) => {
    setListingsLoading(true);
    setListingsError('');
    try {
      const params = { sellerId, page: pg, size: PAGE_SIZE };
      if (status !== 'ALL') params.status = status;
      const res = await getListings(params);
      const payload = res?.data?.data ?? res?.data;
      const content = Array.isArray(payload?.content) ? payload.content : Array.isArray(payload) ? payload : [];
      setListings(content);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalElements(payload?.totalElements ?? content.length);
    } catch (err) {
      setListingsError(err?.message || 'Không tải được danh sách tin đăng.');
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) fetchListings(id, page, activeTab);
  }, [id, page, activeTab, fetchListings]);

  const handleTabChange = (_, newTab) => {
    setActiveTab(newTab);
    setPage(0);
  };

  /* ── Render ── */
  const sc = user ? statusColor(user.status) : statusColor(null);

  return (
    <Box>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/users')}
        sx={{ mb: 3, color: '#fff', textTransform: 'none' }}
      >
        Quay lại danh sách
      </Button>

      {userError && <Alert severity="error" sx={{ mb: 2 }}>{userError}</Alert>}

      <Grid container spacing={3}>
        {/* ── LEFT: User info ── */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: '#fff' }}>
            {userLoading ? (
              <Stack alignItems="center" spacing={2}>
                <Skeleton variant="circular" width={96} height={96} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Skeleton width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Skeleton width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
              </Stack>
            ) : user ? (
              <>
                <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                  <Avatar src={user.avatarUrl} sx={{ width: 96, height: 96, border: `3px solid ${PURPLE}` }}>
                    {!user.avatarUrl && (user.fullName?.[0] ?? user.email?.[0] ?? '?')}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>{user.fullName ?? user.full_name ?? '—'}</Typography>
                  <Chip
                    label={user.status ?? '—'}
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: 999, bgcolor: sc.bg, color: sc.color }}
                  />
                </Stack>

                <Stack spacing={0}>
                  <InfoRow icon={<PersonIcon fontSize="small" />} label="ID" value={`#${user.id}`} />
                  <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={user.email} />
                  <InfoRow icon={<PersonIcon fontSize="small" />} label="Vai trò" value={user.role} />
                  <InfoRow icon={<StarIcon fontSize="small" />} label="Uy tín" value={user.reputationScore ?? user.reputation_score} />
                  <InfoRow icon={<ReportIcon fontSize="small" />} label="Vi phạm" value={user.violationCount ?? user.violation_count ?? 0} />
                  <InfoRow icon={<CalendarTodayIcon fontSize="small" />} label="Ngày tạo" value={formatDate(user.createdAt ?? user.created_at)} />
                </Stack>
              </>
            ) : null}
          </Paper>
        </Grid>

        {/* ── RIGHT: Listings ── */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: '#fff' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Tin đăng
              {!listingsLoading && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.45)' }}>
                  ({totalElements} tin)
                </Typography>
              )}
            </Typography>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              TabIndicatorProps={{ style: { display: 'none' } }}
              sx={{
                mb: 2.5,
                minHeight: 40,
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 36,
                  borderRadius: 999,
                  px: 2,
                  '&.Mui-selected': {
                    color: '#fff',
                    background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`,
                  },
                },
              }}
            >
              <Tab label="Đang bán" value="ACTIVE" disableRipple />
              <Tab label="Đã bán" value="SOLD" disableRipple />
              <Tab label="Đã ẩn" value="HIDDEN" disableRipple />
              <Tab label="Hết hạn" value="EXPIRED" disableRipple />
            </Tabs>

            {/* Content */}
            {listingsError && <Alert severity="error" sx={{ mb: 2 }}>{listingsError}</Alert>}

            {listingsLoading ? (
              <Stack spacing={1.5}>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={90} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }} />
                ))}
              </Stack>
            ) : listings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: 'rgba(255,255,255,0.35)' }}>
                <Typography fontSize={36} sx={{ mb: 1 }}>📭</Typography>
                <Typography fontSize={14}>Không có tin đăng nào trong tab này.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {listings.map((l, i) => (
                  <ListingCard key={l.listingId ?? l.id ?? i} listing={l} />
                ))}
              </Stack>
            )}

            {/* Pagination */}
            {!listingsLoading && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, v) => setPage(v - 1)}
                  color="primary"
                  size="small"
                  sx={{ '& .MuiPaginationItem-root': { color: 'rgba(255,255,255,0.7)' } }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
