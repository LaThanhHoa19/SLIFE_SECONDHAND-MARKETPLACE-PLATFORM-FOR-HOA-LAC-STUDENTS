/** Mục đích: Quản lý báo cáo. Lý do chỉ xem trong dialog Xem xét. API: GET/PATCH /api/admin/reports. */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { getReports, processReport } from '../../api/reportApi';
import ReusableTable from '../../components/common/ReusableTable';

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
}

function extractReportList(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function reportedDisplay(row) {
  return row.reportedDisplayName ?? row.reported_display_name ?? '-';
}

function statusLabel(status) {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 'Chờ xử lý';
  if (s === 'RESOLVED') return 'Đã xử lý';
  if (s === 'REJECTED') return 'Từ chối';
  if (s === 'DISMISSED') return 'Đã bỏ qua';
  return status || '-';
}

function statusChipSx(status) {
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

function isPendingRow(row) {
  const s = (row.status || 'PENDING').toUpperCase();
  return s === 'PENDING';
}

function reportRowId(row) {
  return row?.reportId ?? row?.id;
}

const REPORT_TABLE_SURFACE = '#19191B';
const REPORT_TABLE_BORDER = '#3E3E42';

const reportManagementPaperSx = {
  bgcolor: REPORT_TABLE_SURFACE,
  border: `1px solid ${REPORT_TABLE_BORDER}`,
  borderRadius: 1,
  boxShadow: 'none',
  '& .MuiCircularProgress-root': {
    color: '#fff',
  },
};

const reportManagementTableSx = {
  '& thead th': {
    color: 'rgba(255,255,255,0.88)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottom: `1px solid ${REPORT_TABLE_BORDER}`,
  },
  '& tbody td': {
    color: '#ffffff',
    borderBottom: `1px solid ${REPORT_TABLE_BORDER}`,
  },
  '& .MuiTableCell-root:not(:last-of-type)': {
    borderRight: `1px solid ${REPORT_TABLE_BORDER}`,
  },
  '& tbody .MuiTableRow-root:nth-of-type(odd)': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '& tbody .MuiTableRow-root:hover': {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  '& tbody .MuiTableRow-root:last-of-type .MuiTableCell-root': {
    borderBottom: 'none',
  },
  '& .MuiTypography-root': {
    color: 'rgba(255,255,255,0.72)',
  },
};

export default function ReportManagementPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('APPROVE');
  const [activeReport, setActiveReport] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await getReports();
      setReports(extractReportList(response));
    } catch (error) {
      setErrorMessage(error?.message || 'Không tải được danh sách báo cáo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const openProcessDialog = (row, action) => {
    setActiveReport(row);
    setDialogAction(action);
    setAdminNote('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (processingId != null) return;
    setDialogOpen(false);
    setActiveReport(null);
    setAdminNote('');
  };

  const handleConfirmProcess = async () => {
    const id = reportRowId(activeReport);
    if (id == null) return;
    try {
      setProcessingId(id);
      await processReport(id, {
        action: dialogAction,
        note: adminNote.trim() || undefined,
      });
      setSnackbar({
        open: true,
        message:
          dialogAction === 'APPROVE'
            ? 'Đã duyệt báo cáo.'
            : 'Đã từ chối báo cáo.',
        severity: 'success',
      });
      setDialogOpen(false);
      setActiveReport(null);
      setAdminNote('');
      await loadReports();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.message || 'Không xử lý được báo cáo.',
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    {
      id: 'reportId',
      label: 'ID',
      width: 72,
      render: (row) => reportRowId(row) ?? '-',
    },
    {
      id: 'reporterName',
      label: 'Người báo cáo',
      width: 160,
      render: (row) => row.reporterName || '-',
    },
    {
      id: 'reportedDisplayName',
      label: 'Người bị báo cáo',
      width: 200,
      render: (row) => {
        const text = String(reportedDisplay(row));
        return (
          <Tooltip title={text} placement="top-start">
            <Typography
              variant="body2"
              sx={{
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              {text}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      id: 'reason',
      label: 'Lý do',
      render: (row) => {
        const text = row.reason?.trim() || '-';
        return (
          <Tooltip title={text} placement="top-start">
            <Typography
              variant="body2"
              sx={{
                maxWidth: 320,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              {text}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      id: 'status',
      label: 'Trạng thái',
      width: 130,
      render: (row) => (
        <Chip
          label={statusLabel(row.status)}
          size="small"
          sx={{
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 999,
            ...statusChipSx(row.status),
          }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Thời gian',
      width: 168,
      render: (row) => formatDate(row.createdAt),
    },
    {
      id: 'actions',
      label: 'Thao tác',
      width: 120,
      align: 'center',
      render: (row) => {
        const id = reportRowId(row);
        const busy = processingId === id;
        return (
          <Button
            size="small"
            variant="outlined"
            disabled={busy || isLoading}
            onClick={() => openReviewDialog(row)}
            sx={{
              textTransform: 'none',
              borderRadius: 999,
              minWidth: 100,
              borderColor: 'rgba(139,92,246,0.55)',
              color: '#c4b5fd',
              '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(139,92,246,0.08)' },
            }}
          >
            Xem xét
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
            Quản lý báo cáo
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Xử lý các báo cáo vi phạm đang chờ (tin đăng, người dùng).
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={loadReports}
          disabled={isLoading}
          sx={{ borderRadius: 999, textTransform: 'none', px: 3 }}
        >
          Tải lại dữ liệu
        </Button>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <ReusableTable
        columns={columns}
        rows={reports}
        getRowId={(row) => String(reportRowId(row) ?? '')}
        isLoading={isLoading}
        emptyMessage="Không có báo cáo đang chờ xử lý."
        paperSx={reportManagementPaperSx}
        tableSx={reportManagementTableSx}
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#fff', bgcolor: '#1e1b24' }}>
          Xem xét báo cáo
          {activeReport && reportRowId(activeReport) != null ? ` #${reportRowId(activeReport)}` : ''}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e1b24', pt: 1 }}>
          {activeReport && (
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>Người báo cáo: </Box>
                {activeReport.reporterName || '-'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>Người bị báo cáo: </Box>
                {reportedDisplay(activeReport)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>Trạng thái: </Box>
                {statusLabel(activeReport.status)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>Thời gian: </Box>
                {formatDate(activeReport.createdAt)}
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
                  {(activeReport.reason && String(activeReport.reason).trim()) || '—'}
                </Typography>
              </Box>
            </Stack>
          )}
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
            sx={{
              '& .MuiOutlinedInput-root': { color: '#fff' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1e1b24', px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={handleCloseDialog} disabled={processingId != null} sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Đóng
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            color="error"
            onClick={() => submitProcess('REJECT')}
            disabled={processingId != null || (activeReport && !isPendingRow(activeReport))}
          >
            {processingId != null ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => submitProcess('APPROVE')}
            disabled={processingId != null || (activeReport && !isPendingRow(activeReport))}
          >
            Duyệt
          </Button>
        </DialogActions>
      </Dialog>

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
