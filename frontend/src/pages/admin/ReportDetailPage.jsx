/** Chi tiết báo cáo (admin) — UI Stitch / dark curator. Route: /admin/reports/:reportId */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminReportById, processReport } from '../../api/reportApi';
import { useToast } from '../../context/ToastContext';
import { ADMIN_THEME as t } from '../../theme/adminTheme';
import {
    findReportAdminMockById,
    isMockReportRow,
    isPendingRow,
    isReportAdminMockEnabled,
    reportedDisplay,
    reportedUserAvatarUrl,
    reportRowId,
    reporterAvatarUrl,
    statusLabel,
    targetSubjectLabel,
    targetTypeLabel,
    writeReportMockPatch,
} from './reportAdminUtils';

const STITCH_PAGE_GRADIENT = `linear-gradient(165deg, #0b0e1e 0%, #0f0e18 40%, ${t.bgApp} 100%)`;
const CARD_BG = 'rgba(22, 27, 34, 0.92)';
const CARD_BORDER = 'rgba(99, 102, 241, 0.14)';
const STITCH_INDIGO = '#6366f1';
const MUTED_LABEL = 'rgba(148, 163, 184, 0.9)';

function reporterInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function targetTypeBadgeSx(type) {
    const u = String(type || '').toUpperCase();
    if (u === 'LISTING' || u === 'POST') {
        return {
            bgcolor: 'rgba(99, 102, 241, 0.18)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.35)',
        };
    }
    if (u === 'USER') {
        return {
            bgcolor: 'rgba(34, 211, 238, 0.1)',
            color: '#67e8f9',
            border: '1px solid rgba(34, 211, 238, 0.28)',
        };
    }
    return {
        bgcolor: 'rgba(251, 191, 36, 0.1)',
        color: '#fcd34d',
        border: '1px solid rgba(251, 191, 36, 0.28)',
    };
}

function relatedCategoryLine(targetType) {
    const u = String(targetType || '').toUpperCase();
    if (u === 'LISTING' || u === 'POST') return 'Tin đăng / marketplace';
    if (u === 'USER') return 'Hồ sơ người dùng';
    if (u === 'COMMENT') return 'Bình luận trên bài';
    if (u === 'MESSAGE') return 'Tin nhắn / hội thoại';
    return 'Liên quan nền tảng';
}

function statusBannerSx(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'PENDING') {
        return {
            border: '1px solid rgba(234, 179, 8, 0.45)',
            bgcolor: 'rgba(234, 179, 8, 0.08)',
            iconColor: '#facc15',
        };
    }
    if (s === 'RESOLVED') {
        return {
            border: '1px solid rgba(74, 222, 128, 0.4)',
            bgcolor: 'rgba(34, 197, 94, 0.08)',
            iconColor: '#4ade80',
        };
    }
    if (s === 'REJECTED') {
        return {
            border: '1px solid rgba(248, 113, 113, 0.4)',
            bgcolor: 'rgba(248, 113, 113, 0.08)',
            iconColor: '#f87171',
        };
    }
    return {
        border: `1px solid ${CARD_BORDER}`,
        bgcolor: 'rgba(255,255,255,0.04)',
        iconColor: '#94a3b8',
    };
}

const cardSx = {
    bgcolor: CARD_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 2,
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(8px)',
};

export default function ReportDetailPage() {
    const { reportId: reportIdParam } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [adminNote, setAdminNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [quickActionLoading, setQuickActionLoading] = useState(false);
    const [autoClosedByQuickAction, setAutoClosedByQuickAction] = useState(false);
    const { showToast } = useToast();

    const loadReport = useCallback(async () => {
        const idStr = reportIdParam;
        const n = Number(idStr);
        if (!Number.isFinite(n)) {
            setLoadError('ID báo cáo không hợp lệ.');
            setReport(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setLoadError('');
            if (isReportAdminMockEnabled()) {
                const mockRow = findReportAdminMockById(n);
                if (mockRow) {
                    setReport(mockRow);
                    return;
                }
            }
            const response = await getAdminReportById(n);
            const payload = response?.data?.data ?? response?.data;
            if (!payload || payload.reportId == null) {
                const fallback = findReportAdminMockById(n);
                if (fallback) {
                    setReport(fallback);
                    setLoadError('');
                    return;
                }
                setReport(null);
                setLoadError('Không tìm thấy báo cáo.');
                return;
            }
            setReport(payload);
        } catch (e) {
            const fallback = findReportAdminMockById(n);
            if (fallback) {
                setReport(fallback);
                setLoadError('');
            } else {
                setReport(null);
                setLoadError(e?.message || 'Không tải được báo cáo.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [reportIdParam]);

    useEffect(() => {
        setAutoClosedByQuickAction(false);
        loadReport();
    }, [loadReport]);

    useEffect(() => {
        if (report?.adminNote != null) {
            setAdminNote(String(report.adminNote));
        } else {
            setAdminNote('');
        }
    }, [report]);

    const handleBack = () => {
        navigate('/admin/reports');
    };

    const submitProcess = async (action) => {
        const id = reportRowId(report);
        if (id == null) return;

        if (isMockReportRow(report)) {
            setSubmitting(true);
            try {
                const nextStatus = action === 'APPROVE' ? 'RESOLVED' : 'REJECTED';
                const note = adminNote.trim();
                writeReportMockPatch(id, {
                    status: nextStatus,
                    ...(note ? { adminNote: note } : {}),
                });
                setReport((r) =>
                    r ? { ...r, status: nextStatus, adminNote: note || r.adminNote } : r,
                );
                showToast(
                    action === 'APPROVE'
                        ? 'Đã duyệt (mock, chỉ lưu trên trình duyệt).'
                        : 'Đã từ chối (mock, chỉ lưu trên trình duyệt).',
                    'success',
                );
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
            showToast(action === 'APPROVE' ? 'Đã duyệt báo cáo.' : 'Đã từ chối báo cáo.', 'success');
            await loadReport();
        } catch (error) {
            showToast(error?.message || 'Không xử lý được báo cáo.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickHideListing = async () => {
        const id = reportRowId(report);
        const listingId = report?.listingId ?? report?.targetId;
        if (!id || !listingId) return;
        const ok = window.confirm(`Bạn có chắc muốn ẩn tin #${listingId}?`);
        if (!ok) return;

        try {
            setQuickActionLoading(true);
            await processReport(id, {
                action: 'HIDE_LISTING_APPROVE',
                note: adminNote.trim() || `Admin đã ẩn tin #${listingId} do vi phạm.`,
            });
            setAutoClosedByQuickAction(true);
            showToast(`Đã ẩn tin #${listingId} và đóng báo cáo.`, 'success');
            await loadReport();
        } catch (error) {
            showToast(error?.message || 'Không thể ẩn tin.', 'error');
        } finally {
            setQuickActionLoading(false);
        }
    };

    const handleQuickBanUser = async () => {
        const id = reportRowId(report);
        const userId = report?.targetId;
        if (!id || !userId) return;
        const ok = window.confirm(`Bạn có chắc muốn ban user #${userId}?`);
        if (!ok) return;

        try {
            setQuickActionLoading(true);
            await processReport(id, {
                action: 'BAN_USER_APPROVE',
                note: adminNote.trim() || `Admin đã ban user #${userId} do vi phạm.`,
            });
            setAutoClosedByQuickAction(true);
            showToast(`Đã ban user #${userId} và đóng báo cáo.`, 'success');
            await loadReport();
        } catch (error) {
            showToast(error?.message || 'Không thể ban user.', 'error');
        } finally {
            setQuickActionLoading(false);
        }
    };

    const timestampParts = useMemo(() => {
        const raw = report?.createdAt;
        if (!raw) return { time: '—', date: '—' };
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return { time: '—', date: '—' };
        return {
            time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            date: d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }),
        };
    }, [report?.createdAt]);

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={360}
                sx={(theme) => ({
                    background: STITCH_PAGE_GRADIENT,
                    mx: { xs: theme.spacing(-2), sm: theme.spacing(-3) },
                    px: { xs: theme.spacing(2), sm: theme.spacing(3) },
                    width: { xs: `calc(100% + ${theme.spacing(4)})`, sm: `calc(100% + ${theme.spacing(6)})` },
                    boxSizing: 'border-box',
                })}
            >
                <CircularProgress sx={{ color: STITCH_INDIGO }} />
            </Box>
        );
    }

    if (!report || loadError) {
        return (
            <Box
                sx={(theme) => ({
                    background: STITCH_PAGE_GRADIENT,
                    mx: { xs: theme.spacing(-2), sm: theme.spacing(-3) },
                    px: { xs: theme.spacing(2), sm: theme.spacing(3) },
                    width: { xs: `calc(100% + ${theme.spacing(4)})`, sm: `calc(100% + ${theme.spacing(6)})` },
                    boxSizing: 'border-box',
                    py: 2,
                })}
            >
                <Button
                    variant="contained"
                    startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
                    onClick={handleBack}
                    sx={{
                        color: '#ffffff',
                        bgcolor: '#7c3aed !important',
                        border: '1px solid #8b5cf6',
                        textTransform: 'none',
                        fontWeight: 800,
                        mb: 2,
                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                        '&:hover': {
                            bgcolor: '#6d28d9 !important',
                        },
                    }}
                >
                    Quay lại danh sách báo cáo
                </Button>
                <Alert
                    severity="error"
                    sx={{
                        bgcolor: 'rgba(239, 68, 68, 0.12)',
                        color: '#fecaca',
                        border: '1px solid rgba(248,113,113,0.25)',
                    }}
                >
                    {loadError || 'Không tìm thấy báo cáo.'}
                </Alert>
            </Box>
        );
    }

    const rid = reportRowId(report);
    const canAct = isPendingRow(report);
    const isActionLocked = submitting || quickActionLoading || !canAct;
    const subjectLabel = targetSubjectLabel(report.targetType);
    const typeLabel = targetTypeLabel(report.targetType);
    const displayTitle = reportedDisplay(report);
    const statusSx = statusBannerSx(report.status);
    const tt = String(report.targetType || '').toUpperCase();
    const listingId =
        report.listingId ?? (tt === 'LISTING' || tt === 'POST' ? report.targetId : null);
    const reportedAvatar = reportedUserAvatarUrl(report);

    return (
        <Box
            sx={(theme) => ({
                background: STITCH_PAGE_GRADIENT,
                borderRadius: 0,
                border: 'none',
                py: { xs: 0, sm: 2 },
                mb: 2,
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
            <Button
                variant="contained"
                startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
                onClick={handleBack}
                sx={{
                    color: '#eef2ff',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: '1px solid rgba(129, 140, 248, 0.7)',
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    mb: 2.5,
                    pl: 0.5,
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                        color: '#ffffff',
                    },
                }}
            >
                Quay lại danh sách báo cáo
            </Button>

            {isMockReportRow(report) && (
                <Alert
                    severity="info"
                    sx={{
                        mb: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.28)',
                        color: 'rgba(191, 219, 254, 0.98)',
                        '& .MuiAlert-icon': { color: '#60a5fa' },
                    }}
                >
                    Đang xem báo cáo mock — Duyệt/Từ chối chỉ cập nhật trong session (không gọi API).
                </Alert>
            )}

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'stretch', md: 'flex-start' }}
                justifyContent="space-between"
                gap={2.5}
                sx={{ mb: 3 }}
            >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="overline"
                        sx={{
                            color: MUTED_LABEL,
                            letterSpacing: '0.2em',
                            fontWeight: 700,
                            fontSize: 10,
                            display: 'block',
                            mb: 0.75,
                        }}
                    >
                        CHI TIẾT BÁO CÁO
                        {rid != null ? ` • ID #${rid}` : ''}
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            color: '#fff',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            fontSize: { xs: 24, sm: 30 },
                            lineHeight: 1.2,
                        }}
                    >
                        Xem xét báo cáo
                        {rid != null ? ` #${rid}` : ''}
                    </Typography>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        ...cardSx,
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flexShrink: 0,
                        border: statusSx.border,
                        bgcolor: statusSx.bgcolor,
                    }}
                >
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: statusSx.iconColor,
                            boxShadow: `0 0 12px ${statusSx.iconColor}`,
                        }}
                    />
                    <Box>
                        <Typography variant="caption" sx={{ color: MUTED_LABEL, fontWeight: 700, letterSpacing: '0.08em' }}>
                            TRẠNG THÁI
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                            {statusLabel(report.status)}
                        </Typography>
                    </Box>
                </Paper>
            </Stack>

            <Grid container spacing={2.5}>
                <Grid item xs={12} lg={8}>
                    <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
                        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(99, 102, 241, 0.15)',
                                    border: `1px solid ${CARD_BORDER}`,
                                }}
                            >
                                <DescriptionOutlinedIcon sx={{ color: STITCH_INDIGO, fontSize: 22 }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 800, fontSize: 17 }}>
                                Thông tin báo cáo
                            </Typography>
                        </Stack>

                        <Typography
                            variant="h5"
                            sx={{
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: { xs: 20, sm: 22 },
                                mb: 2.5,
                                lineHeight: 1.35,
                            }}
                        >
                            {displayTitle}
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ color: MUTED_LABEL, fontWeight: 700, letterSpacing: '0.06em' }}>
                                    NGƯỜI BÁO CÁO
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.25 }}>
                                    <Avatar
                                        src={reporterAvatarUrl(report) || undefined}
                                        imgProps={{ referrerPolicy: 'no-referrer' }}
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            fontWeight: 800,
                                            bgcolor: 'rgba(99, 102, 241, 0.35)',
                                            color: '#e0e7ff',
                                            border: `1px solid ${CARD_BORDER}`,
                                        }}
                                    >
                                        {reporterInitials(report.reporterName)}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700 }} noWrap>
                                            {report.reporterName || '—'}
                                        </Typography>
                                        <Chip
                                            label="Thành viên"
                                            size="small"
                                            sx={{
                                                mt: 0.5,
                                                height: 22,
                                                fontSize: 10,
                                                fontWeight: 700,
                                                bgcolor: 'rgba(34, 197, 94, 0.12)',
                                                color: '#86efac',
                                                border: '1px solid rgba(34, 197, 94, 0.25)',
                                            }}
                                        />
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ color: MUTED_LABEL, fontWeight: 700, letterSpacing: '0.06em' }}>
                                    ĐỐI TƯỢNG
                                </Typography>
                                <Stack spacing={1} sx={{ mt: 1.25 }}>
                                    <Chip
                                        label={typeLabel}
                                        size="small"
                                        sx={{
                                            alignSelf: 'flex-start',
                                            fontWeight: 800,
                                            fontSize: 10,
                                            letterSpacing: '0.02em',
                                            ...targetTypeBadgeSx(report.targetType),
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                                        {subjectLabel}
                                        {report.targetId != null ? (
                                            <>
                                                {' '}
                                                · ID:{' '}
                                                <Box component="span" sx={{ color: STITCH_INDIGO, fontWeight: 700 }}>
                                                    {report.targetId}
                                                </Box>
                                            </>
                                        ) : null}
                                    </Typography>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Typography variant="caption" sx={{ color: MUTED_LABEL, fontWeight: 700, letterSpacing: '0.06em' }}>
                            LÝ DO BÁO CÁO
                        </Typography>
                        <Box
                            sx={{
                                mt: 1,
                                pl: 2,
                                py: 1.5,
                                borderLeft: '4px solid rgba(248, 113, 113, 0.75)',
                                bgcolor: 'rgba(248, 113, 113, 0.06)',
                                borderRadius: '0 12px 12px 0',
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(254, 226, 226, 0.95)',
                                    fontStyle: 'italic',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {(report.reason && String(report.reason).trim()) || '—'}
                            </Typography>
                        </Box>

                        {(report.listingId != null || report.conversationId != null) && (
                            <Typography variant="caption" sx={{ color: 'rgba(148, 163, 184, 0.75)', display: 'block', mt: 2 }}>
                                {report.listingId != null && `Tin liên quan: #${report.listingId}`}
                                {report.listingId != null && report.conversationId != null && ' · '}
                                {report.conversationId != null && `Hội thoại: #${report.conversationId}`}
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Stack spacing={2.5}>
                        <Paper elevation={0} sx={{ ...cardSx, p: 2.25 }}>
                            <Typography variant="caption" sx={{ color: MUTED_LABEL, fontWeight: 700, letterSpacing: '0.08em' }}>
                                THỜI ĐIỂM
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mt: 1, fontVariantNumeric: 'tabular-nums' }}>
                                {timestampParts.time}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(203, 213, 225, 0.9)', mt: 0.5 }}>
                                {timestampParts.date}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ ...cardSx, p: 2.25 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                <Typography variant="caption" sx={{ color: MUTED_LABEL, fontWeight: 700, letterSpacing: '0.08em' }}>
                                    LIÊN QUAN
                                </Typography>
                                {listingId != null && (
                                    <Tooltip title="Mở tin đăng">
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/listings/${listingId}`)}
                                            sx={{
                                                color: STITCH_INDIGO,
                                                bgcolor: 'rgba(99, 102, 241, 0.12)',
                                                '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.22)' },
                                            }}
                                        >
                                            <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        flexShrink: 0,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(99, 102, 241, 0.12)',
                                        border: `1px solid ${CARD_BORDER}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {tt === 'USER' ? (
                                        <Avatar
                                            src={reportedAvatar || undefined}
                                            imgProps={{ referrerPolicy: 'no-referrer' }}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: 2,
                                                bgcolor: 'rgba(34, 211, 238, 0.22)',
                                                color: '#cffafe',
                                                fontWeight: 900,
                                            }}
                                        >
                                            {reporterInitials(displayTitle)}
                                        </Avatar>
                                    ) : (
                                        <Typography variant="h6" sx={{ color: STITCH_INDIGO, fontWeight: 900 }}>
                                            {(displayTitle || '?').slice(0, 1).toUpperCase()}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#f1f5f9', fontWeight: 700 }} noWrap>
                                        {listingId != null ? `Tin #${listingId}` : `Đối tượng #${report.targetId ?? '—'}`}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: MUTED_LABEL, display: 'block', mt: 0.25 }} noWrap>
                                        {relatedCategoryLine(report.targetType)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.88)', mt: 0.75, lineHeight: 1.4 }} noWrap>
                                        {displayTitle}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper elevation={0} sx={{ ...cardSx, p: 2.25 }}>
                            <Typography variant="caption" sx={{ color: MUTED_LABEL, fontWeight: 700, letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                                GHI CHÚ NỘI BỘ
                            </Typography>
                            <TextField
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                fullWidth
                                multiline
                                minRows={3}
                                placeholder="Ghi chú cho hồ sơ xử lý (chỉ admin)…"
                                disabled={isActionLocked}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#f8fafc',
                                        bgcolor: 'rgba(15, 23, 42, 0.82)',
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: 'rgba(129, 140, 248, 0.46)' },
                                        '&:hover fieldset': { borderColor: 'rgba(129, 140, 248, 0.68)' },
                                        '&.Mui-focused fieldset': { borderColor: '#a5b4fc' },
                                        '&.Mui-disabled': {
                                            bgcolor: 'rgba(30, 41, 59, 0.82)',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: '#f8fafc',
                                        WebkitTextFillColor: '#f8fafc',
                                        opacity: 1,
                                    },
                                    '& .MuiInputBase-input.Mui-disabled': {
                                        color: '#e2e8f0',
                                        WebkitTextFillColor: '#e2e8f0',
                                        opacity: 1,
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: 'rgba(226, 232, 240, 0.75)',
                                        opacity: 1,
                                    },
                                }}
                            />
                            {!canAct && (
                                <Typography variant="caption" sx={{ color: 'rgba(148, 163, 184, 0.8)', mt: 1, display: 'block' }}>
                                    Báo cáo đã đóng — chỉ xem ghi chú đã lưu.
                                </Typography>
                            )}
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>

            <Paper
                elevation={0}
                sx={{
                    ...cardSx,
                    mt: 3,
                    p: { xs: 2, sm: 2.5 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    border: `1px solid rgba(99, 102, 241, 0.2)`,
                    boxShadow: `0 0 40px rgba(99, 102, 241, 0.08), 0 20px 48px rgba(0,0,0,0.4)`,
                }}
            >
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
                    <ShieldOutlinedIcon sx={{ color: STITCH_INDIGO, fontSize: 28, mt: 0.25, flexShrink: 0 }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 800 }}>
                            Cần quyết định xem xét
                        </Typography>
                        <Typography variant="body2" sx={{ color: MUTED_LABEL, mt: 0.5, lineHeight: 1.5 }}>
                            {canAct
                                ? `Hoàn tất điều tra cho báo cáo${rid != null ? ` #${rid}` : ''}. Duyệt: ghi nhận vi phạm. Từ chối: báo cáo không được chấp nhận.`
                                : 'Báo cáo này đã được xử lý. Bạn có thể xem lại thông tin phía trên.'}
                        </Typography>
                        {autoClosedByQuickAction && (
                            <Chip
                                size="small"
                                label="Đã đóng tự động sau thao tác quản trị"
                                sx={{
                                    mt: 1,
                                    height: 24,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    bgcolor: 'rgba(34, 197, 94, 0.14)',
                                    color: '#86efac',
                                    border: '1px solid rgba(34, 197, 94, 0.35)',
                                }}
                            />
                        )}
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1.25} justifyContent="flex-end" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
                    {canAct && (tt === 'LISTING' || tt === 'POST') && (
                        <Button
                            variant="outlined"
                            onClick={handleQuickHideListing}
                            disabled={isActionLocked}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 800,
                                borderRadius: 999,
                                px: 2.5,
                                borderColor: 'rgba(248, 113, 113, 0.65)',
                                color: '#fecaca',
                                bgcolor: 'rgba(127, 29, 29, 0.2)',
                                '&:hover': {
                                    borderColor: 'rgba(248, 113, 113, 0.9)',
                                    bgcolor: 'rgba(127, 29, 29, 0.32)',
                                },
                            }}
                        >
                            {quickActionLoading ? 'Đang xử lý…' : 'Ẩn bài'}
                        </Button>
                    )}

                    {canAct && tt === 'USER' && (
                        <Button
                            variant="outlined"
                            onClick={handleQuickBanUser}
                            disabled={submitting || quickActionLoading}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 800,
                                borderRadius: 999,
                                px: 2.5,
                                borderColor: 'rgba(251, 191, 36, 0.7)',
                                color: '#fde68a',
                                bgcolor: 'rgba(120, 53, 15, 0.2)',
                                '&:hover': {
                                    borderColor: 'rgba(251, 191, 36, 0.95)',
                                    bgcolor: 'rgba(120, 53, 15, 0.34)',
                                },
                            }}
                        >
                            {quickActionLoading ? 'Đang xử lý…' : 'Ban user'}
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        onClick={() => submitProcess('REJECT')}
                        disabled={submitting || quickActionLoading || !canAct}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 800,
                            borderRadius: 999,
                            px: 2.5,
                            borderColor: 'rgba(252, 165, 165, 0.75)',
                            color: '#ffe4e6',
                            bgcolor: 'rgba(127, 29, 29, 0.22)',
                            '&:hover': {
                                borderColor: 'rgba(252, 165, 165, 0.95)',
                                color: '#fff1f2',
                                bgcolor: 'rgba(127, 29, 29, 0.35)',
                            },
                            '&.Mui-disabled': {
                                borderColor: 'rgba(248, 113, 113, 0.28)',
                                color: 'rgba(254, 202, 202, 0.55)',
                            },
                        }}
                    >
                        {submitting ? 'Đang xử lý…' : 'Từ chối'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => submitProcess('APPROVE')}
                        disabled={submitting || quickActionLoading || !canAct}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 800,
                            borderRadius: 999,
                            px: 2.75,
                            background: `linear-gradient(135deg, ${STITCH_INDIGO} 0%, #4f46e5 100%)`,
                            boxShadow: '0 8px 28px rgba(99, 102, 241, 0.45)',
                            '&:hover': {
                                boxShadow: '0 10px 32px rgba(99, 102, 241, 0.55)',
                                background: `linear-gradient(135deg, #4f46e5 0%, ${STITCH_INDIGO} 100%)`,
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(99, 102, 241, 0.25)',
                                color: 'rgba(255,255,255,0.45)',
                            },
                        }}
                    >
                        Duyệt
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
