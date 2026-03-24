/** Chi tiết báo cáo (admin). Route: /admin/reports/:reportId */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getReports, processReport } from '../../api/reportApi';

// —— Dữ liệu demo + helpers (cùng file; ReportManagementPage import các export cần thiết) ——

export const REPORT_DEMO_ROWS = [
  {
    reportId: 99001,
    targetType: 'USER',
    reporterName: 'Nguyễn Văn An',
    reportedDisplayName: 'Trần Thị Bình',
    reason: 'Gửi link lừa đảo trong chat.',
    status: 'PENDING',
    createdAt: '2026-03-10T09:15:00.000Z',
    _demo: true,
  },
  {
    reportId: 99002,
    targetType: 'LISTING',
    reporterName: 'Lê Minh Tuấn',
    reportedDisplayName: 'MacBook Air M1 cũ — còn bảo hành',
    reason: 'Hình ảnh không khớp mô tả, nghi ngờ hàng nhái.',
    status: 'PENDING',
    createdAt: '2026-03-11T14:22:00.000Z',
    _demo: true,
  },
  {
    reportId: 99003,
    targetType: 'USER',
    reporterName: 'Phạm Thu Hà',
    reportedDisplayName: 'Đỗ Quốc Huy',
    reason: 'Spam tin nhắn quảng cáo ngoài phạm vi SLIFE.',
    status: 'RESOLVED',
    createdAt: '2026-03-12T08:40:00.000Z',
    _demo: true,
  },
  {
    reportId: 99004,
    targetType: 'LISTING',
    reporterName: 'Hoàng Nam',
    reportedDisplayName: 'iPhone 13 — pin chai',
    reason: 'Giá niêm yết thấp hơn nhiều so với thị trường, nghi ngờ scam.',
    status: 'PENDING',
    createdAt: '2026-03-13T16:05:00.000Z',
    _demo: true,
  },
  {
    reportId: 99005,
    targetType: 'USER',
    reporterName: 'Vũ Khánh Linh',
    reportedDisplayName: 'Bùi Gia Bảo',
    reason: 'Lời lẽ xúc phạm trong phần bình luận tin đăng.',
    status: 'REJECTED',
    createdAt: '2026-03-14T11:30:00.000Z',
    _demo: true,
  },
];

const DEMO_OVERRIDE_KEY = 'slife_admin_report_demo_v1';

export function readDemoOverrides() {
  try {
    const raw = sessionStorage.getItem(DEMO_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function writeDemoOverride(reportId, patch) {
  const o = readDemoOverrides();
  o[String(reportId)] = { ...(o[String(reportId)] || {}), ...patch };
  sessionStorage.setItem(DEMO_OVERRIDE_KEY, JSON.stringify(o));
}

function applyDemoOverridesToRows(rows) {
  const o = readDemoOverrides();
  return rows.map((r) => {
    const id = r.reportId ?? r.id;
    const extra = id != null ? o[String(id)] : null;
    return extra ? { ...r, ...extra } : r;
  });
}

export function buildMergedReportList(fromApi) {
  const api = Array.isArray(fromApi) ? fromApi : [];
  return [...applyDemoOverridesToRows(REPORT_DEMO_ROWS), ...api];
}

export function formatReportDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
}

export function reportedDisplay(row) {
  return row?.reportedDisplayName ?? row?.reported_display_name ?? '-';
}

export function statusLabel(status) {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 'Chờ xử lý';
  if (s === 'RESOLVED') return 'Đã xử lý';
  if (s === 'REJECTED') return 'Từ chối';
  if (s === 'DISMISSED') return 'Đã bỏ qua';
  return status || '-';
}

export function statusChipSx(status) {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') {
    return { bgcolor: 'rgba(234,179,8,0.12)', color: '#facc15' };
  }
  if (s === 'RESOLVED') {
    return { bgcolor: 'rgba(34,197,94,0.12)', color: '#4ade80' };
  }
  if (s === 'REJECTED') {
    return { bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171' };
  }
  if (s === 'DISMISSED') {
    return { bgcolor: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
  }
  return { bgcolor: 'rgba(148,163,184,0.12)', color: '#cbd5e1' };
}

export function isPendingRow(row) {
  const s = (row?.status || 'PENDING').toUpperCase();
  return s === 'PENDING';
}

export function reportRowId(row) {
  return row?.reportId ?? row?.id;
}

/** Loại đích báo cáo: LISTING (tin đăng) hoặc USER — khớp backend `targetType`. */
export function reportTargetType(row) {
  const t = String(row?.targetType ?? row?.target_type ?? '').toUpperCase();
  if (t === 'LISTING' || t === 'USER') return t;
  return '';
}

export function findReportInList(list, idStr) {
  const n = Number(idStr);
  if (!Number.isFinite(n)) return null;
  return list.find((r) => reportRowId(r) === n) ?? null;
}

function extractReportList(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function ReportDetailPage() {
  const { reportId: reportIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadReport = useCallback(async () => {
    const idStr = reportIdParam;
    const fromNav = location.state?.report;
    if (fromNav && String(reportRowId(fromNav)) === String(idStr)) {
      const rid = reportRowId(fromNav);
      const extra = rid != null ? readDemoOverrides()[String(rid)] : null;
      setReport(extra ? { ...fromNav, ...extra } : fromNav);
      setLoadError('');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError('');
      const response = await getReports();
      const merged = buildMergedReportList(extractReportList(response));
      const found = findReportInList(merged, idStr);
      setReport(found);
      if (!found) {
        setLoadError('Không tìm thấy báo cáo.');
      }
    } catch (e) {
      const merged = buildMergedReportList([]);
      const found = findReportInList(merged, idStr);
      setReport(found);
      if (found) {
        setLoadError('');
      } else {
        setLoadError(e?.message || 'Không tải được báo cáo.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [reportIdParam, location.state]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleBack = () => {
    navigate('/admin/reports');
  };

  const submitProcess = async (action) => {
    const id = reportRowId(report);
    if (id == null) return;

    if (report?._demo) {
      setSubmitting(true);
      try {
        const nextStatus = action === 'APPROVE' ? 'RESOLVED' : 'REJECTED';
        writeDemoOverride(id, { status: nextStatus });
        setReport((r) => (r ? { ...r, status: nextStatus } : r));
        setSnackbar({
          open: true,
          message: action === 'APPROVE' ? 'Đã duyệt (dữ liệu demo).' : 'Đã từ chối (dữ liệu demo).',
          severity: 'success',
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      await processReport(id, {
        action,
        note: adminNote.trim() || undefined,
      });
      setSnackbar({
        open: true,
        message: action === 'APPROVE' ? 'Đã duyệt báo cáo.' : 'Đã từ chối báo cáo.',
        severity: 'success',
      });
      await loadReport();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.message || 'Không xử lý được báo cáo.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  if (!report || loadError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ color: 'rgba(255,255,255,0.85)', textTransform: 'none', mb: 2 }}
        >
          Quay lại danh sách
        </Button>
        <Alert severity="error">{loadError || 'Không tìm thấy báo cáo.'}</Alert>
      </Box>
    );
  }

  const rid = reportRowId(report);
  const canAct = isPendingRow(report);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton
          aria-label="Quay lại"
          onClick={handleBack}
          sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
          Xem xét báo cáo
          {rid != null ? ` #${rid}` : ''}
        </Typography>
      </Stack>

      <Box
        sx={{
          bgcolor: '#19191B',
          border: '1px solid #3E3E42',
          borderRadius: 1,
          p: 2.5,
          maxWidth: 640,
        }}
      >
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>Người báo cáo: </Box>
            {report.reporterName || '-'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>
              {reportTargetType(report) === 'LISTING' ? 'Bài đăng bị báo cáo' : 'Người bị báo cáo'}:{' '}
            </Box>
            {reportedDisplay(report)}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="body2" component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>
              Trạng thái:
            </Typography>
            <Chip
              label={statusLabel(report.status)}
              size="small"
              sx={{
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                ...statusChipSx(report.status),
              }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>Thời gian: </Box>
            {formatReportDate(report.createdAt)}
          </Typography>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', mb: 0.5 }}>
              Lý do
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.92)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {(report.reason && String(report.reason).trim()) || '—'}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', mb: 1 }}>
          Duyệt: ghi nhận vi phạm và áp dụng xử lý theo quy định. Từ chối: báo cáo không được chấp nhận.
        </Typography>
        <TextField
          label="Ghi chú nội bộ (tùy chọn)"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          placeholder="Ghi chú cho hồ sơ xử lý..."
          disabled={submitting || !canAct}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': { color: '#fff' },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
          }}
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            color="error"
            onClick={() => submitProcess('REJECT')}
            disabled={submitting || !canAct}
          >
            {submitting ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
          <Button
            variant="contained"
            onClick={() => submitProcess('APPROVE')}
            disabled={submitting || !canAct}
            sx={{
              bgcolor: '#8B5CF6',
              color: '#fff',
              '&:hover': { bgcolor: '#7c3aed' },
              '&.Mui-disabled': { bgcolor: 'rgba(139,92,246,0.35)', color: 'rgba(255,255,255,0.5)' },
            }}
          >
            Duyệt
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
