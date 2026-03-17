/**
 * DealDetailPage — Chi tiết giao dịch (SCRUM-81, SCRUM-82, SCRUM-162)
 * API: GET /api/deals/{id}, PUT /api/deals/{id}/confirm, POST /api/deals/{id}/reminder
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { getDeal, confirmDeal, sendReminder } from '../../api/dealApi';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { fullImageUrl } from '../../utils/constants';

// ── StatusBadge (SCRUM-82) ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xác nhận', color: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'success' },
  COMPLETED: { label: 'Hoàn thành', color: 'info' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status ?? 'Không rõ', color: 'default' };
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size="small"
      sx={{ fontWeight: 700, letterSpacing: 0.3, px: 0.5 }}
    />
  );
}

// ── Dev mock (chỉ dùng khi backend chưa trả data) ────────────────────────────

const DEV_MOCK_DEAL = import.meta.env.DEV
  ? {
      id: 1,
      status: 'PENDING',
      dealPrice: 350000,
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      confirmedAt: null,
      pickupTime: new Date(Date.now() + 86400_000).toISOString(),
      address: {
        locationName: 'Tòa nhà B1 — Hòa Lạc Campus',
        addressText: 'Km 29, Đại lộ Thăng Long, Thạch Thất, Hà Nội',
      },
      conversationId: 42,
      listing: {
        id: 7,
        title: '[MOCK] Laptop Dell XPS 13 cũ còn đẹp',
        price: 450000,
        isGiveaway: false,
        sellerId: 2,
        sellerSummary: 'Nguyen Van A',
        images: [],
      },
      proposedBy: { id: 3, fullName: 'Tran Thi B' },
    }
  : null;

// ── helpers ───────────────────────────────────────────────────────────────────

function getPayload(res) {
  const b = res?.data;
  return b?.data ?? b;
}

function fmtPrice(val) {
  if (val == null) return '—';
  return `${Number(val).toLocaleString('vi-VN')} ₫`;
}

function fmtAddress(address) {
  if (!address) return null;
  const parts = [address.locationName, address.addressText].filter(Boolean);
  return parts.join(' — ') || null;
}

function fmtDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── FormField — TextField read-only dạng form ────────────────────────────────

function FormField({ label, value, icon, multiline }) {
  return (
    <TextField
      label={label}
      value={value ?? '—'}
      size="small"
      fullWidth
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      slotProps={{
        input: {
          readOnly: true,
          startAdornment: icon ? (
            <InputAdornment position="start">{icon}</InputAdornment>
          ) : undefined,
        },
      }}
      sx={{
        '& .MuiInputBase-input': { cursor: 'default' },
        '& .MuiOutlinedInput-root': {
          bgcolor: 'grey.50',
          '&:hover fieldset': { borderColor: 'divider' },
          '&.Mui-focused fieldset': { borderColor: 'divider', borderWidth: 1 },
        },
      }}
    />
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.7rem', mb: 1.5, mt: 0.5 }}>
      {children}
    </Typography>
  );
}

// ── DealDetailPage ────────────────────────────────────────────────────────────

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [reminderSending, setReminderSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDeal(id)
      .then((res) => {
        const data = getPayload(res);
        // Fallback sang mock khi backend chưa trả data (chỉ trong dev)
        setDeal(data ?? DEV_MOCK_DEAL);
        setError('');
      })
      .catch((err) => {
        if (DEV_MOCK_DEAL) {
          setDeal(DEV_MOCK_DEAL);
          setError('');
        } else {
          setError(err?.response?.data?.message || err?.message || 'Không tải được giao dịch.');
          setDeal(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── xác nhận deal ────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await confirmDeal(id);
      const updated = getPayload(res);
      setDeal((prev) => ({ ...prev, ...(updated ?? {}), status: updated?.status ?? 'CONFIRMED' }));
      setConfirmOpen(false);
      showSnack('Giao dịch đã được xác nhận thành công!');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xác nhận thất bại. Vui lòng thử lại.';
      showSnack(msg, 'error');
      setConfirmOpen(false);
    } finally {
      setConfirming(false);
    }
  };

  // ── gửi nhắc nhở ─────────────────────────────────────────────────────────────

  const handleReminder = async () => {
    setReminderSending(true);
    try {
      await sendReminder(id);
      showSnack('Đã gửi nhắc nhở thành công!');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gửi nhắc nhở thất bại.';
      showSnack(msg, 'error');
    } finally {
      setReminderSending(false);
    }
  };

  // ── loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !deal) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error" gutterBottom>
          {error || 'Không tìm thấy giao dịch.'}
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 1 }}>
          Quay lại
        </Button>
      </Box>
    );
  }

  // ── derived ────────────────────────────────────────────────────────────────

  const currentUserId = currentUser?.id ?? currentUser?.user_id;
  const sellerId = deal.listing?.sellerId ?? deal.listing?.seller?.id ?? deal.sellerId;
  const buyerId = deal.proposedById ?? deal.proposedBy?.id ?? deal.buyerId;
  const isSeller = currentUserId != null && String(currentUserId) === String(sellerId);
  // Trong dev mock, luôn hiện Confirm Button để test UI
  const canConfirm = (isSeller || !!DEV_MOCK_DEAL) && deal.status === 'PENDING';
  const canRemind = deal.status === 'CONFIRMED';

  const listingImage = deal.listing?.images?.[0]
    ? fullImageUrl(deal.listing.images[0])
    : null;

  const buyerLabel =
    deal.proposedBy?.fullName ?? deal.buyerName ?? (buyerId ? `#${buyerId}` : '—');
  const sellerLabel =
    deal.listing?.sellerSummary ?? deal.sellerName ?? (sellerId ? `#${sellerId}` : '—');

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', py: 3, px: 2 }}>
      {/* Back */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Quay lại
      </Button>

      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* ── Form header ── */}
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Giao dịch #{deal.id}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Tạo lúc {fmtDate(deal.createdAt)}
              </Typography>
            </Box>
            <StatusBadge status={deal.status} />
          </Stack>
        </Box>

        <Box sx={{ px: 3, py: 3 }}>
          {/* ── Section: Tin đăng ── */}
          <SectionTitle>Tin đăng</SectionTitle>

          {/* Thumbnail + link */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            {listingImage ? (
              <Box
                component="img"
                src={listingImage}
                alt={deal.listing?.title}
                sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }}
              />
            ) : (
              <Box sx={{
                width: 64, height: 64, borderRadius: 1.5, bgcolor: 'grey.200',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <StoreOutlinedIcon sx={{ color: 'grey.400' }} />
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  cursor: deal.listing?.id ? 'pointer' : 'default',
                  '&:hover': deal.listing?.id ? { color: 'primary.main', textDecoration: 'underline' } : {},
                }}
                onClick={() => deal.listing?.id && navigate(`/listings/${deal.listing.id}`)}
              >
                {deal.listing?.title ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Giá niêm yết:{' '}
                <strong>{deal.listing?.isGiveaway ? 'Cho tặng' : fmtPrice(deal.listing?.price)}</strong>
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* ── Section: Thông tin giao dịch ── */}
          <SectionTitle>Thông tin giao dịch</SectionTitle>
          <Stack spacing={2}>
            <FormField
              label="Giá thỏa thuận"
              value={fmtPrice(deal.dealPrice)}
              icon={<AttachMoneyIcon fontSize="small" />}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormField
                label="Người mua"
                value={buyerLabel}
                icon={<PersonOutlineIcon fontSize="small" />}
              />
              <FormField
                label="Người bán"
                value={sellerLabel}
                icon={<StoreOutlinedIcon fontSize="small" />}
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          {/* ── Section: Thời gian & Địa điểm ── */}
          <SectionTitle>Thời gian &amp; Địa điểm</SectionTitle>
          <Stack spacing={2}>
            <FormField
              label="Thời gian nhận hàng"
              value={fmtDate(deal.pickupTime)}
              icon={<AccessTimeIcon fontSize="small" />}
            />
            <FormField
              label="Địa điểm nhận hàng"
              value={fmtAddress(deal.address) ?? '—'}
              icon={<LocationOnOutlinedIcon fontSize="small" />}
              multiline
            />
            {deal.confirmedAt && (
              <FormField
                label="Xác nhận lúc"
                value={fmtDate(deal.confirmedAt)}
                icon={<CheckCircleOutlineIcon fontSize="small" />}
              />
            )}
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          {/* ── Section: Hành động ── */}
          <SectionTitle>Hành động</SectionTitle>
          <Stack spacing={1.5}>
            {/* Confirm Button (SCRUM-81) — nổi bật, full-width, chỉ seller + PENDING */}
            {canConfirm && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => setConfirmOpen(true)}
                sx={{ py: 1.4, fontWeight: 700, fontSize: '1rem', textTransform: 'none', borderRadius: 2 }}
              >
                Xác nhận giao dịch
              </Button>
            )}

            {/* Disabled khi đã confirm */}
            {isSeller && deal.status !== 'PENDING' && deal.status !== 'CANCELLED' && (
              <Tooltip title={`Trạng thái: ${STATUS_CONFIG[deal.status]?.label ?? deal.status}`}>
                <span>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    size="large"
                    startIcon={<CheckCircleOutlineIcon />}
                    disabled
                    sx={{ py: 1.4, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                  >
                    Đã xác nhận
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Gửi nhắc nhở */}
            {canRemind && (
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={reminderSending ? <CircularProgress size={18} /> : <NotificationsActiveIcon />}
                onClick={handleReminder}
                disabled={reminderSending}
                sx={{ py: 1.2, textTransform: 'none', borderRadius: 2 }}
              >
                {reminderSending ? 'Đang gửi...' : 'Gửi nhắc nhở'}
              </Button>
            )}

          </Stack>
        </Box>
      </Paper>

      {/* Confirm Dialog (SCRUM-81) */}
      <ConfirmDialog
        open={confirmOpen}
        variant="info"
        title="Xác nhận giao dịch"
        content='Bạn xác nhận đã nhận được tiền và giao hàng cho người mua? Trạng thái sẽ chuyển sang "Đã xác nhận".'
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        loading={confirming}
        onConfirm={handleConfirm}
        onClose={() => setConfirmOpen(false)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
