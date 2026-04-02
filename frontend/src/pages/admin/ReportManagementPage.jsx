/** Danh sách báo cáo admin — UI Stitch / dark dashboard. API: GET /api/admin/reports/page */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Tab,
    TablePagination,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useNavigate } from 'react-router-dom';
import { getReportsPage } from '../../api/reportApi';
import ReusableTable from '../../components/common/ReusableTable';
import { ADMIN_THEME as t } from '../../theme/adminTheme';
import {
    extractSpringPage,
    formatReportDate,
    isReportAdminMockEnabled,
    paginateReportAdminMocks,
    reportedDisplay,
    reportRowId,
    reporterAvatarUrl,
    statusChipSx,
    statusLabel,
    targetSubjectLabel,
} from './reportAdminUtils';

const STITCH_PAGE_GRADIENT = `linear-gradient(165deg, #0b0e1e 0%, #0f0e18 40%, ${t.bgApp} 100%)`;
const TABLE_CARD_BG = 'rgba(18, 22, 43, 0.85)';
const TABLE_BORDER = 'rgba(99, 102, 241, 0.12)';
const STITCH_INDIGO = '#6366f1';

function reporterInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function targetTypeLabel(type) {
    const u = String(type || '').toUpperCase();
    if (u === 'LISTING' || u === 'POST') return 'Tin đăng';
    if (u === 'USER') return 'Người dùng';
    if (u === 'COMMENT') return 'Bình luận';
    if (u === 'MESSAGE') return 'Tin nhắn';
    return 'Khác';
}

function targetTypeChipSx(type) {
    const u = String(type || '').toUpperCase();
    if (u === 'LISTING' || u === 'POST') {
        return {
            bgcolor: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.38)',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.02em',
        };
    }
    if (u === 'USER') {
        return {
            bgcolor: 'rgba(34, 211, 238, 0.12)',
            color: '#67e8f9',
            border: '1px solid rgba(34, 211, 238, 0.28)',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.02em',
        };
    }
    return {
        bgcolor: 'rgba(251, 191, 36, 0.12)',
        color: '#fcd34d',
        border: '1px solid rgba(251, 191, 36, 0.28)',
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.02em',
    };
}

const reportManagementPaperSx = {
    bgcolor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    borderRadius: 0,
    '& .MuiCircularProgress-root': {
        color: STITCH_INDIGO,
    },
};

const reportManagementTableSx = {
    minWidth: 0,
    width: '100%',
    tableLayout: 'fixed',
    '& thead th': {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderBottom: `1px solid ${TABLE_BORDER}`,
        py: 1.5,
    },
    '& tbody td': {
        color: '#f1f5f9',
        borderBottom: `1px solid ${TABLE_BORDER}`,
        py: 1.75,
        fontSize: 13,
        verticalAlign: 'top',
        overflow: 'hidden',
    },
    '& .MuiTableCell-root:not(:last-of-type)': {
        borderRight: 'none',
    },
    '& tbody .MuiTableRow-root:nth-of-type(odd)': {
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    '& tbody .MuiTableRow-root:hover': {
        backgroundColor: 'rgba(99, 102, 241, 0.06)',
    },
    '& tbody .MuiTableRow-root:last-of-type .MuiTableCell-root': {
        borderBottom: 'none',
    },
};

function previewColumnLabel(tab) {
    if (tab === 'LISTING') return 'Bài đăng / đích';
    if (tab === 'USER') return 'Người bị báo cáo';
    return 'Nội dung (bình luận, tin nhắn…)';
}

function StatusStitchChip({ status }) {
    const s = (status || '').toUpperCase();
    const label = statusLabel(status);
    if (s === 'PENDING') {
        return (
            <Chip
                size="small"
                icon={
                    <FiberManualRecordIcon sx={{ fontSize: 10, color: '#facc15 !important', ml: '4px !important' }} />
                }
                label={label.toUpperCase()}
                sx={{
                    fontWeight: 800,
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    height: 26,
                    bgcolor: 'rgba(234, 179, 8, 0.14)',
                    color: '#fde047',
                    border: '1px solid rgba(250, 204, 21, 0.35)',
                    '& .MuiChip-icon': { color: '#facc15' },
                }}
            />
        );
    }
    return (
        <Chip
            label={label}
            size="small"
            sx={{
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                ...statusChipSx(status),
            }}
        />
    );
}

export default function ReportManagementPage() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [reportCategoryTab, setReportCategoryTab] = useState('LISTING');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setPage(0);
    }, [reportCategoryTab, statusFilter]);

    const loadReports = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');
            if (isReportAdminMockEnabled()) {
                const data = paginateReportAdminMocks({
                    targetTypeTab: reportCategoryTab,
                    statusFilter,
                    page,
                    size: rowsPerPage,
                });
                setReports(data.content);
                setTotalElements(data.totalElements);
                return;
            }
            const params = {
                page,
                size: rowsPerPage,
                sortBy: 'createdAt',
                sortDir: 'DESC',
                targetType: reportCategoryTab,
            };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            const response = await getReportsPage(params);
            const data = extractSpringPage(response);
            setReports(data.content);
            setTotalElements(data.totalElements);
            if (data.number !== page) setPage(data.number);
        } catch (error) {
            setErrorMessage(error?.message || 'Không tải được danh sách báo cáo.');
            setReports([]);
            setTotalElements(0);
        } finally {
            setIsLoading(false);
        }
    }, [page, rowsPerPage, reportCategoryTab, statusFilter]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const filteredReports = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return reports;
        return reports.filter((r) => {
            const id = String(reportRowId(r) ?? '');
            const prev = reportedDisplay(r).toLowerCase();
            const name = (r.reporterName || '').toLowerCase();
            const reason = (r.reason || '').toLowerCase();
            const type = (r.targetType || '').toLowerCase();
            return id.includes(q) || prev.includes(q) || name.includes(q) || reason.includes(q) || type.includes(q);
        });
    }, [reports, searchQuery]);

    const goToDetail = (row) => {
        const id = reportRowId(row);
        if (id == null) return;
        navigate(`/admin/reports/${id}`);
    };

    const columns = useMemo(
        () => [
            {
                id: 'reportId',
                label: 'ID',
                width: '6%',
                render: (row) => (
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>
                        {reportRowId(row) ?? '—'}
                    </Typography>
                ),
            },
            {
                id: 'targetType',
                label: 'Loại',
                width: 108,
                render: (row) => (
                    <Chip label={targetTypeLabel(row.targetType)} size="small" sx={{ ...targetTypeChipSx(row.targetType), height: 24 }} />
                ),
            },
            {
                id: 'reporterName',
                label: 'Người báo cáo',
                width: '15%',
                render: (row) => {
                    const name = row.reporterName || '—';
                    return (
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Avatar
                                src={reporterAvatarUrl(row) || undefined}
                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    fontSize: 13,
                                    fontWeight: 800,
                                    bgcolor: 'rgba(99, 102, 241, 0.35)',
                                    color: '#e0e7ff',
                                    border: '1px solid rgba(99, 102, 241, 0.45)',
                                }}
                            >
                                {reporterInitials(name)}
                            </Avatar>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600 }}>
                                {name}
                            </Typography>
                        </Stack>
                    );
                },
            },
            {
                id: 'targetPreview',
                label: previewColumnLabel(reportCategoryTab),
                width: '17%',
                render: (row) => {
                    const text = String(reportedDisplay(row));
                    const hint = targetSubjectLabel(row.targetType);
                    const listingId = row.listingId;
                    return (
                        <Tooltip title={`${hint}: ${text}`} placement="top-start">
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#f8fafc',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {text}
                                </Typography>
                                {listingId != null && (
                                    <Typography variant="caption" sx={{ color: 'rgba(148, 163, 184, 0.95)', display: 'block', mt: 0.25 }}>
                                        ID tin: #{listingId}
                                    </Typography>
                                )}
                            </Box>
                        </Tooltip>
                    );
                },
            },
            {
                id: 'reason',
                label: 'Lý do',
                width: '23%',
                render: (row) => {
                    const text = row.reason?.trim() || '—';
                    return (
                        <Tooltip title={text} placement="top-start">
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'rgba(226, 232, 240, 0.92)',
                                    lineHeight: 1.45,
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
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
                width: '11%',
                render: (row) => <StatusStitchChip status={row.status} />,
            },
            {
                id: 'createdAt',
                label: 'Thời gian',
                width: '11%',
                render: (row) => (
                    <Typography variant="body2" sx={{ color: 'rgba(203, 213, 225, 0.95)', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                        {formatReportDate(row.createdAt)}
                    </Typography>
                ),
            },
            {
                id: 'actions',
                label: 'Thao tác',
                width: '8%',
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
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            fontWeight: 700,
                            fontSize: 12,
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            color: '#c7d2fe',
                            '&:hover': { borderColor: STITCH_INDIGO, bgcolor: 'rgba(99, 102, 241, 0.12)' },
                        }}
                    >
                        Xem xét
                    </Button>
                ),
            },
        ],
        [reportCategoryTab, isLoading],
    );

    const emptyMessage =
        searchQuery.trim() && filteredReports.length === 0
            ? 'Không có dòng nào khớp tìm kiếm trên trang này.'
            : reportCategoryTab === 'LISTING'
                ? 'Không có báo cáo nào về bài đăng.'
                : reportCategoryTab === 'USER'
                    ? 'Không có báo cáo nào về người dùng.'
                    : 'Không có báo cáo bình luận / tin nhắn.';

    return (
        <Box
            sx={(theme) => ({
                background: STITCH_PAGE_GRADIENT,
                borderRadius: 0,
                border: 'none',
                py: { xs: 0, sm: 2.5 },
                mb: 2,
                // Full-bleed trong main: bù padding px của AdminLayout để không còn “cột đen” hai bên
                mx: { xs: theme.spacing(-2), sm: theme.spacing(-3) },
                px: { xs: theme.spacing(2), sm: theme.spacing(3) },
                width: {
                    xs: `calc(100% + ${theme.spacing(4)})`,
                    sm: `calc(100% + ${theme.spacing(6)})`,
                },
                maxWidth: 'none',
                boxSizing: 'border-box',
                alignSelf: 'stretch',
            })}
        >
            <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm trên trang hiện tại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'rgba(148, 163, 184, 0.8)', fontSize: 22 }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    mb: 2.5,
                    maxWidth: '100%',
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 999,
                        bgcolor: 'rgba(15, 23, 42, 0.55)',
                        color: 'rgba(248, 250, 252, 0.95)',
                        '& fieldset': { borderColor: 'rgba(99, 102, 241, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.35)' },
                        '&.Mui-focused fieldset': { borderColor: STITCH_INDIGO },
                    },
                    '& input::placeholder': { color: 'rgba(148, 163, 184, 0.65)', opacity: 1 },
                }}
            />

            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#fecaca' }}>
                    {errorMessage}
                </Alert>
            )}

            {isReportAdminMockEnabled() && (
                <Alert
                    severity="info"
                    sx={{
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.28)',
                        color: 'rgba(191, 219, 254, 0.98)',
                        '& .MuiAlert-icon': { color: '#60a5fa' },
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Đang dùng dữ liệu mock để minh họa giao diện hệ thống.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(147, 197, 253, 0.85)', display: 'block' }}>
                        Tắt mock: <Box component="span" sx={{ fontFamily: 'monospace' }}>VITE_ADMIN_REPORTS_MOCK=false</Box> trong{' '}
                        <Box component="span" sx={{ fontFamily: 'monospace' }}>.env</Box>
                    </Typography>
                </Alert>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} sx={{ mb: 2.5 }}>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            color: '#fff',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            fontSize: { xs: 22, sm: 28 },
                            mb: 0.75,
                        }}
                    >
                        Quản lý báo cáo
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(203, 213, 225, 0.85)', maxWidth: 520, lineHeight: 1.55 }}>
                        Phân loại theo loại hình; lọc theo trạng thái. Tổng trong hệ thống:{' '}
                        <Box component="span" sx={{ color: '#a5b4fc', fontWeight: 800 }}>
                            {totalElements}
                        </Box>
                        .
                        {searchQuery.trim() ? (
                            <>
                                {' '}
                                Khớp trên trang hiện tại:{' '}
                                <Box component="span" sx={{ color: '#fde047', fontWeight: 700 }}>{filteredReports.length}</Box> dòng.
                            </>
                        ) : null}
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="report-status-filter" sx={{ color: 'rgba(148, 163, 184, 0.9)' }}>
                            Trạng thái
                        </InputLabel>
                        <Select
                            labelId="report-status-filter"
                            label="Trạng thái"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{
                                color: 'rgba(248, 250, 252, 0.95)',
                                borderRadius: 999,
                                bgcolor: 'rgba(15, 23, 42, 0.45)',
                                '& fieldset': { borderColor: 'rgba(99, 102, 241, 0.25)' },
                                '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                            }}
                        >
                            <MenuItem value="ALL">Tất cả</MenuItem>
                            <MenuItem value="PENDING">Chờ xử lý</MenuItem>
                            <MenuItem value="RESOLVED">Đã xử lý</MenuItem>
                            <MenuItem value="REJECTED">Từ chối</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={loadReports}
                        disabled={isLoading}
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            px: 2.5,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${STITCH_INDIGO} 0%, #4f46e5 100%)`,
                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                            '&:hover': { boxShadow: '0 10px 28px rgba(99, 102, 241, 0.45)' },
                        }}
                    >
                        Tải lại dữ liệu
                    </Button>
                </Stack>
            </Stack>

            <Tabs
                value={reportCategoryTab}
                onChange={(_, v) => setReportCategoryTab(v)}
                sx={{
                    minHeight: 48,
                    mb: 2,
                    borderBottom: `1px solid ${TABLE_BORDER}`,
                    '& .MuiTab-root': {
                        color: 'rgba(148, 163, 184, 0.85)',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 14,
                        minHeight: 48,
                        mr: 2,
                    },
                    '& .Mui-selected': {
                        color: '#e0e7ff !important',
                    },
                    '& .MuiTabs-indicator': {
                        bgcolor: STITCH_INDIGO,
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                        boxShadow: `0 0 16px ${STITCH_INDIGO}`,
                    },
                }}
            >
                <Tab label="Báo cáo bài đăng" value="LISTING" />
                <Tab label="Báo cáo người dùng" value="USER" />
                <Tab label="Bình luận & tin nhắn" value="OTHER" />
            </Tabs>

            <Box
                sx={{
                    border: `1px solid ${TABLE_BORDER}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: TABLE_CARD_BG,
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
                }}
            >
                <ReusableTable
                    columns={columns}
                    rows={filteredReports}
                    getRowId={(row) => String(reportRowId(row) ?? '')}
                    isLoading={isLoading}
                    emptyMessage={emptyMessage}
                    paperSx={reportManagementPaperSx}
                    tableSx={reportManagementTableSx}
                    tableOverflowX="hidden"
                />
                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 20, 50]}
                    labelRowsPerPage="Số dòng mỗi trang:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}–${to} của ${count === -1 ? to : count}`
                    }
                    sx={{
                        bgcolor: 'rgba(12, 16, 32, 0.6)',
                        color: 'rgba(203, 213, 225, 0.9)',
                        borderTop: `1px solid ${TABLE_BORDER}`,
                        '& .MuiTablePagination-select': { color: '#f1f5f9' },
                        '& .MuiTablePagination-selectIcon': { color: 'rgba(148, 163, 184, 0.8)' },
                        '& .MuiIconButton-root': { color: 'rgba(226, 232, 240, 0.85)' },
                    }}
                />
            </Box>
        </Box>
    );
}
