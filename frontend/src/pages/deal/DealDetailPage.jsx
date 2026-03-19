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
  CircularProgress,
  Divider,
  InputAdornment,
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
import { getDeal, confirmDeal, updatePickupTime, sendReminder } from '../../api/dealApi';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { fullImageUrl } from '../../utils/constants';

// ── Design tokens (đồng bộ ListingForm) ──────────────────────────────────────

const C = {
  bg: '#201D26',
  surface: '#312F37',
  surfaceHover: '#3a3845',
  accent: '#9D6EED',
  accentHover: '#B794F6',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.08)',
};

// ── Đồng bộ kích thước ─────────────────────────────────────────────────────

const FONT = {
    input: '14px',
    label: '12px',
    title: '14px',
    small: '12px',
};

// ── StatusBadge (SCRUM-82) ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ xác nhận', bg: '#ed6c02', color: '#fff' },
  CONFIRMED: { label: 'Đã xác nhận',  bg: '#2e7d32', color: '#fff' },
  COMPLETED: { label: 'Hoàn thành',   bg: '#0277bd', color: '#fff' },
  CANCELLED: { label: 'Đã hủy',       bg: '#c62828', color: '#fff' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status ?? 'Không rõ', bg: '#555', color: '#fff' };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center',
      px: 2, py: 0.6,
      borderRadius: '20px',
      bgcolor: cfg.bg,
      color: cfg.color,
      fontWeight: 700,
      fontSize: '0.88rem',
      letterSpacing: 0.4,
    }}>
      {cfg.label}
    </Box>
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

/** ISO → "YYYY-MM-DDTHH:mm" cho input datetime-local */
function toDatetimeLocal(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── FormField — TextField read-only, dark theme ───────────────────────────────

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
            <InputAdornment position="start">
              <Box sx={{ color: C.textMuted }}>{icon}</Box>
            </InputAdornment>
          ) : undefined,
        },
        inputLabel: { shrink: true },
      }}
      sx={{
          '& .MuiInputBase-root': {
              backgroundColor: C.surface,
              color: C.text,
              fontSize: FONT.input,
              borderRadius: '10px',
          },
          '& .MuiInputBase-input': {
              color: C.text,
              cursor: 'default',
              fontSize: FONT.input,
          },
          '& .MuiInputLabel-root': {
              color: C.textMuted,
              fontSize: FONT.label,
          },
        '& .MuiInputLabel-root.Mui-focused': { color: C.accent },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: C.accent,
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: C.accent,
          borderWidth: 1,
        },
      }}
    />
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
    return (
        <Typography
            fontWeight={600}
            fontSize={FONT.title} // 18px
            sx={{ color: C.text, mb: 2, mt: 0.5 }}
        >
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
  const [pickupTimeLocal, setPickupTimeLocal] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDeal(id)
      .then((res) => {
        const data = getPayload(res);
        const resolved = data ?? DEV_MOCK_DEAL;
        setDeal(resolved);
        setPickupTimeLocal(toDatetimeLocal(resolved?.pickupTime));
        setError('');
      })
      .catch((err) => {
        if (DEV_MOCK_DEAL) {
          setDeal(DEV_MOCK_DEAL);
          setPickupTimeLocal(toDatetimeLocal(DEV_MOCK_DEAL.pickupTime));
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
      // Lưu pickup time nếu đã chỉnh sửa
      if (pickupTimeLocal) {
        await updatePickupTime(id, new Date(pickupTimeLocal).toISOString());
      }
      const res = await confirmDeal(id);
      const updated = getPayload(res);
      setDeal((prev) => ({
        ...prev,
        ...(updated ?? {}),
        status: updated?.status ?? 'CONFIRMED',
        pickupTime: pickupTimeLocal ? new Date(pickupTimeLocal).toISOString() : prev.pickupTime,
      }));
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
    <Box sx={{ maxWidth: 660, mx: 'auto', py: 3, px: 2 }}>
      {/* Back */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<ArrowBackIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />}
        onClick={() => navigate(-1)}
        sx={{
          mb: 1.5,
          color: C.text,
          fontSize: '13px',
          borderRadius: '14px',
          borderColor: C.border,
          backgroundColor: '#201D26',
          textTransform: 'none',
          px: 1.5,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          '&:hover': {
            backgroundColor: '#2D2A33',
            borderColor: C.border,
            color: C.text,
          },
        }}
      >
        Quay lại
      </Button>

      <Box
        sx={{
          maxWidth: '1200px',
          width: '100%',
          mx: 'auto',
          p: 2.5,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          backgroundColor: C.bg,
          color: C.text,
        }}
      >
        {/* ── Header ── */}
        <Box mb={2}>
          <Typography fontWeight={700} fontSize="18px" color={C.text}>
            Xác nhận giao dịch
          </Typography>
          <Typography fontSize="13px" sx={{ color: C.textMuted, mt: 0.5 }}>
            Vui lòng kiểm tra kỹ các thông tin dưới đây trước khi hoàn tất.
          </Typography>
        </Box>
        <Divider sx={{ borderColor: C.border, mb: 2 }} />

        {/* ── Section: Tin đăng ── */}
        <SectionTitle>Tin đăng</SectionTitle>
        <Box
          sx={{
            display: 'flex', gap: 2, alignItems: 'center', mb: 2,
            p: 2, borderRadius: '10px', bgcolor: C.surface,
            cursor: deal.listing?.id ? 'pointer' : 'default',
            '&:hover': deal.listing?.id ? { bgcolor: C.surfaceHover } : {},
            transition: 'background 0.15s',
          }}
          onClick={() => deal.listing?.id && navigate(`/listings/${deal.listing.id}`)}
        >
          {listingImage ? (
            <Box
              component="img"
              src={listingImage}
              alt={deal.listing?.title}
              sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
            />
          ) : (
            <Box sx={{
              width: 80, height: 80, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <StoreOutlinedIcon sx={{ color: C.textMuted, fontSize: 28 }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={600} fontSize="15px" color={C.text} noWrap>
              {deal.listing?.title ?? '—'}
            </Typography>
            <Typography fontSize="13px" sx={{ color: C.textMuted, mt: 0.4 }}>
              Giá niêm yết:{' '}
              <Box component="span" sx={{ color: C.accentHover, fontWeight: 600 }}>
                {deal.listing?.isGiveaway ? 'Cho tặng' : fmtPrice(deal.listing?.price)}
              </Box>
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: C.border, mb: 2 }} />

        {/* ── Section: Thông tin giao dịch ── */}
        <SectionTitle>Thông tin giao dịch</SectionTitle>
        <Stack spacing={2.5} mb={2}>
          <FormField
            label="Giá thỏa thuận"
            value={fmtPrice(deal.dealPrice)}
            icon={<AttachMoneyIcon />}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
            <FormField
              label="Người mua"
              value={buyerLabel}
              icon={<PersonOutlineIcon />}
            />
            <FormField
              label="Người bán"
              value={sellerLabel}
              icon={<StoreOutlinedIcon />}
            />
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: C.border, mb: 2 }} />

          {/* ── Section: Thời gian & Địa điểm ── */}
          <SectionTitle>Thời gian &amp; Địa điểm</SectionTitle>
          <Stack spacing={2.5} mb={2}>
            {/* Pickup time — editable */}
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                bgcolor: 'rgba(157,110,237,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AccessTimeIcon sx={{ color: C.accent, fontSize: 20 }} />
              </Box>
              <TextField
                type="datetime-local"
                label="Thời gian nhận hàng"
                size="small"
                fullWidth
                value={pickupTimeLocal}
                onChange={(e) => setPickupTimeLocal(e.target.value)}
                slotProps={{
                  input: {},
                  inputLabel: { shrink: true },
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: C.surface, color: C.text,
                    fontSize: FONT.input, borderRadius: '10px',
                  },
                  '& .MuiInputBase-input': {
                    color: C.text, fontSize: FONT.input, colorScheme: 'dark',
                  },
                  '& .MuiInputLabel-root': { color: C.textMuted, fontSize: FONT.label },
                  '& .MuiInputLabel-root.Mui-focused': { color: C.accent },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.accent },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.accent, borderWidth: 1 },
                }}
              />
            </Stack>

            {/* Address */}
            <Stack direction="row" alignItems="flex-start" spacing={2.5}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                bgcolor: 'rgba(157,110,237,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mt: 0.5,
              }}>
                <LocationOnOutlinedIcon sx={{ color: C.accent, fontSize: 20 }} />
              </Box>
              <FormField
                label="Địa điểm nhận hàng"
                value={fmtAddress(deal.address) ?? '—'}
                multiline
              />
            </Stack>
          {deal.confirmedAt && (
            <FormField
              label="Xác nhận lúc"
              value={fmtDate(deal.confirmedAt)}
              icon={<CheckCircleOutlineIcon />}
            />
          )}
        </Stack>

        <Divider sx={{ borderColor: C.border, mb: 2 }} />

        {/* ── Hành động ── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={1.5}>
          {/* Confirm Button (SCRUM-81) */}
          {canConfirm && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => setConfirmOpen(true)}
              sx={{
                backgroundColor: C.accent,
                py: 1.5,
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': { backgroundColor: C.accentHover },
              }}
            >
              Xác nhận thông tin giao dịch
            </Button>
          )}

          {/* Disabled khi đã confirm */}
          {isSeller && deal.status !== 'PENDING' && deal.status !== 'CANCELLED' && (
            <Tooltip title={`Trạng thái: ${STATUS_CONFIG[deal.status]?.label ?? deal.status}`}>
              <span style={{ flex: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<CheckCircleOutlineIcon />}
                  disabled
                  sx={{
                    py: 0.8,
                    fontSize: FONT.input,
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                  }}
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
              startIcon={reminderSending ? <CircularProgress size={20} sx={{ color: C.text }} /> : <NotificationsActiveIcon />}
              onClick={handleReminder}
              disabled={reminderSending}
              sx={{
                backgroundColor: '#E0E0E0',
                color: C.bg,
                py: 0.8,
                fontSize: FONT.input,
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#d5d5d5', border: 'none' },
              }}
            >
              {reminderSending ? 'Đang gửi...' : 'Gửi nhắc nhở'}
            </Button>
          )}
        </Stack>
      </Box>

      {/* Confirm Dialog (SCRUM-81) */}
      <ConfirmDialog
        open={confirmOpen}
        variant="info"
        title="Xác nhận thông tin"
        content='Bạn xác nhận thông tin giao dịch đã được đầy đủ và chính xác? Trạng thái sẽ chuyển sang "Đã xác nhận".'
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
