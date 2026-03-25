/** Danh sách báo cáo admin. Chi tiết: /admin/reports/:reportId */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../../api/reportApi';
import ReusableTable from '../../components/common/ReusableTable';
import {
  buildMergedReportList,
  formatReportDate,
  reportedDisplay,
  reportRowId,
  reportTargetType,
  statusLabel,
  statusChipSx,
} from './ReportDetailPage';

function extractReportList(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  return [];
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
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  /** Tab: báo cáo tin đăng vs báo cáo tài khoản */
  const [reportCategoryTab, setReportCategoryTab] = useState('LISTING');

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await getReports();
      const fromApi = extractReportList(response);
      setReports(buildMergedReportList(fromApi));
    } catch (error) {
      setErrorMessage(error?.message || 'Không tải được danh sách báo cáo.');
      setReports(buildMergedReportList([]));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const goToDetail = (row) => {
    const id = reportRowId(row);
    if (id == null) return;
    navigate(`/admin/reports/${id}`, { state: { report: row } });
  };

  const tabCounts = useMemo(() => {
    let listing = 0;
    let user = 0;
    reports.forEach((r) => {
      const t = reportTargetType(r);
      if (t === 'LISTING') listing += 1;
      else if (t === 'USER') user += 1;
    });
    return { listing, user };
  }, [reports]);

  const filteredReports = useMemo(
    () => reports.filter((r) => reportTargetType(r) === reportCategoryTab),
    [reports, reportCategoryTab],
  );

  const columns = useMemo(
    () => [
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
      label: reportCategoryTab === 'LISTING' ? 'Bài đăng bị báo cáo' : 'Người bị báo cáo',
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
      render: (row) => formatReportDate(row.createdAt),
    },
    {
      id: 'actions',
      label: 'Thao tác',
      width: 120,
      align: 'center',
      render: (row) => (
        <Button
          size="small"
          variant="outlined"
          disabled={isLoading}
          onClick={() => goToDetail(row)}
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
      ),
    },
    ],
    [reportCategoryTab],
  );

  const emptyMessage =
    reportCategoryTab === 'LISTING'
      ? 'Không có báo cáo nào về bài đăng.'
      : 'Không có báo cáo nào về người dùng.';

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
            Quản lý báo cáo
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Chọn tab để xem báo cáo theo bài đăng hoặc theo người dùng.
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

      <Tabs
        value={reportCategoryTab}
        onChange={(_, v) => setReportCategoryTab(v)}
        sx={{
          minHeight: 44,
          mb: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          '& .MuiTab-root': {
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            minHeight: 44,
          },
          '& .Mui-selected': {
            color: '#c4b5fd !important',
          },
          '& .MuiTabs-indicator': {
            bgcolor: '#8B5CF6',
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        <Tab label={`Báo cáo bài đăng (${tabCounts.listing})`} value="LISTING" />
        <Tab label={`Báo cáo người dùng (${tabCounts.user})`} value="USER" />
      </Tabs>

      <ReusableTable
        columns={columns}
        rows={filteredReports}
        getRowId={(row) => String(reportRowId(row) ?? '')}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        paperSx={reportManagementPaperSx}
        tableSx={reportManagementTableSx}
      />
    </Box>
  );
}
