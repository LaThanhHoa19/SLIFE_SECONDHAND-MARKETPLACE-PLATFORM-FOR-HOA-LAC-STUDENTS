/**
 * Dashboard admin — số liệu từ API + biểu đồ SVG/CSS (không dùng thư viện chart ngoài).
 * Tránh lỗi resolve module trong Docker khi volume node_modules lệch package-lock.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Grid, Paper, Skeleton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import FlagIcon from '@mui/icons-material/Flag';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import {
    getAdminDashboard,
    getAdminDashboardCharts,
    getAdminAuditLog,
} from '../../api/adminDashboardApi';

const SURFACE = '#19191B';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#ffffff';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';
const POLL_MS = 20_000;

const PALETTE = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    red: '#ef4444',
    orange: '#f59e0b',
    teal: '#14b8a6',
    pink: '#ec4899',
    indigo: '#6366f1',
};

const numberVi = new Intl.NumberFormat('vi-VN');
const fmt = (n) => (n != null ? numberVi.format(n) : '—');
const fmtPct = (n, total) => (total ? `${((n / total) * 100).toFixed(1)}%` : '0.0%');

function StatCard({ icon, label, value, sub, color, loading }) {
    return (
        <Paper
            sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: SURFACE,
                border: `1px solid ${BORDER}`,
                boxShadow: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
            }}
        >
            <Box
                sx={{
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: alpha(color, 0.12),
                    color,
                    display: 'inline-flex',
                    alignSelf: 'flex-start',
                    mb: 0.5,
                }}
            >
                {icon}
            </Box>
            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 500 }}>
                {label}
            </Typography>
            {loading ? (
                <Skeleton variant="text" width={80} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
            ) : (
                <Typography variant="h5" sx={{ fontWeight: 800, color: TEXT }}>
                    {value}
                </Typography>
            )}
            {sub && (
                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                    {sub}
                </Typography>
            )}
        </Paper>
    );
}

function Section({ title, children, minHeight }) {
    return (
        <Paper
            sx={{
                borderRadius: 3,
                bgcolor: SURFACE,
                border: `1px solid ${BORDER}`,
                boxShadow: 'none',
                overflow: 'hidden',
                minHeight,
            }}
        >
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${BORDER}` }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT }}>
                    {title}
                </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>{children}</Box>
        </Paper>
    );
}

/** Nhiều đường trên cùng thang Y (max chung). */
function SvgMultiLineChart({ data, series, height = 240 }) {
    const [hover, setHover] = useState(null);
    const viewW = 720;
    const viewH = height;
    const pad = { t: 12, r: 8, b: 32, l: 36 };
    const iw = viewW - pad.l - pad.r;
    const ih = viewH - pad.t - pad.b;

    const maxY = useMemo(() => {
        let m = 1;
        for (const row of data) {
            for (const s of series) {
                m = Math.max(m, Number(row[s.key]) || 0);
            }
        }
        return m;
    }, [data, series]);

    const n = data.length;
    const xAt = (i) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
    const yAt = (v) => pad.t + ih - (maxY ? (v / maxY) * ih : 0);

    const paths = series.map((s) => {
        if (n === 0) return { ...s, d: '' };
        const pts = data.map((row, i) => `${xAt(i)},${yAt(Number(row[s.key]) || 0)}`);
        return { ...s, d: `M ${pts.join(' L ')}` };
    });

    const idxFromClientX = (svgEl, clientX) => {
        if (!svgEl || n === 0) return null;
        const rect = svgEl.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * viewW;
        if (x < pad.l || x > pad.l + iw) return null;
        const t = (x - pad.l) / iw;
        const i = Math.round(t * (n <= 1 ? 0 : n - 1));
        return Math.max(0, Math.min(n - 1, i));
    };

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <svg
                viewBox={`0 0 ${viewW} ${viewH}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseLeave={() => setHover(null)}
                onMouseMove={(e) => {
                    const i = idxFromClientX(e.currentTarget, e.clientX);
                    setHover(i);
                }}
            >
                <defs>
                    {series.map((s) => (
                        <linearGradient key={s.key} id={`lg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                        </linearGradient>
                    ))}
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = pad.t + ih * (1 - t);
                    return (
                        <g key={t}>
                            <line x1={pad.l} y1={y} x2={pad.l + iw} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <text x={4} y={y + 4} fill={TEXT_MUTED} fontSize="10">
                                {numberVi.format(Math.round(maxY * t))}
                            </text>
                        </g>
                    );
                })}
                {paths.map((p) => {
                    if (!p.d) return null;
                    const fillPath = `${p.d} L ${xAt(n - 1)} ${pad.t + ih} L ${xAt(0)} ${pad.t + ih} Z`;
                    return (
                        <g key={p.key}>
                            <path d={fillPath} fill={`url(#lg-${p.key})`} stroke="none" />
                            <path d={p.d} fill="none" stroke={p.color} strokeWidth="2" strokeLinejoin="round" />
                        </g>
                    );
                })}
                {data.map((row, i) => (
                    <text
                        key={row.date}
                        x={xAt(i)}
                        y={viewH - 8}
                        fill={TEXT_MUTED}
                        fontSize="9"
                        textAnchor="middle"
                    >
                        {row.dateShort}
                    </text>
                ))}
                {hover != null && n > 0 && (
                    <line
                        x1={xAt(hover)}
                        y1={pad.t}
                        x2={xAt(hover)}
                        y2={pad.t + ih}
                        stroke="rgba(255,255,255,0.2)"
                        strokeDasharray="4 4"
                    />
                )}
            </svg>
            {hover != null && data[hover] && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: '#111113',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        fontSize: 12,
                        color: TEXT,
                        pointerEvents: 'none',
                    }}
                >
                    <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block' }}>
                        {data[hover].date}
                    </Typography>
                    {series.map((s) => (
                        <Box key={s.key} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mt: 0.25 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                            <span style={{ color: TEXT_MUTED }}>{s.name}:</span>
                            <strong>{numberVi.format(Number(data[hover][s.key]) || 0)}</strong>
                        </Box>
                    ))}
                </Box>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                {series.map((s) => (
                    <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 3, borderRadius: 1, bgcolor: s.color }} />
                        <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            {s.name}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

/** Donut CSS conic-gradient */
function DonutChart({ segments, size = 160 }) {
    const total = segments.reduce((a, s) => a + s.value, 0);
    if (total <= 0) {
        return (
            <Box
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    mx: 'auto',
                    border: `8px solid ${BORDER}`,
                }}
            />
        );
    }
    let acc = 0;
    const parts = segments.map((s) => {
        const pct = (s.value / total) * 100;
        const start = acc;
        acc += pct;
        return `${s.color} ${start}% ${acc}%`;
    });
    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                mx: 'auto',
                background: `conic-gradient(${parts.join(', ')})`,
                WebkitMask: 'radial-gradient(farthest-side, transparent 58%, #000 59%)',
                mask: 'radial-gradient(farthest-side, transparent 58%, #000 59%)',
            }}
        />
    );
}

function VerticalBarChart({ items, height = 180 }) {
    const max = Math.max(1, ...items.map((i) => i.value));
    return (
        <Box sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', gap: 1, height, pt: 1 }}>
            {items.map((it) => (
                <Box
                    key={it.name}
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: 0,
                        justifyContent: 'flex-end',
                    }}
                >
                    <Typography variant="caption" sx={{ color: TEXT, fontWeight: 700, mb: 0.25 }}>
                        {fmt(it.value)}
                    </Typography>
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 38,
                            height: 110,
                            borderRadius: 999,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            overflow: 'hidden',
                            border: `1px solid ${BORDER}`,
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                height: `${(it.value / max) * 100}%`,
                                minHeight: it.value > 0 ? 6 : 2,
                                bgcolor: it.color,
                                borderRadius: 999,
                                transition: 'height 0.2s',
                            }}
                        />
                    </Box>
                    <Typography
                        variant="caption"
                        sx={{ color: TEXT_MUTED, mt: 0.75, textAlign: 'center', fontSize: 9, lineHeight: 1.2 }}
                    >
                        {it.name}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

function HorizontalBarChart({ items }) {
    const max = Math.max(1, ...items.map((i) => i.value));
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {items.map((it, i) => (
                <Box key={it.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                        <Typography variant="caption" sx={{ color: TEXT_MUTED, pr: 1 }} noWrap>
                            {it.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: TEXT, fontWeight: 700 }}>
                            {fmt(it.value)}
                        </Typography>
                    </Box>
                    <Box sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <Box
                            sx={{
                                height: '100%',
                                width: `${(it.value / max) * 100}%`,
                                bgcolor: it.color ?? PALETTE.blue,
                                borderRadius: 999,
                            }}
                        />
                    </Box>
                </Box>
            ))}
        </Box>
    );
}


function AuditRow({ log }) {
    const d = log.occurredAt ? new Date(log.occurredAt) : null;
    const timeStr = d
        ? `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
        : '—';

    const actionLabel =
        {
            REPORT_APPROVE: 'Duyệt báo cáo',
            REPORT_REJECT: 'Từ chối báo cáo',
            REPORT_CLOSE: 'Đóng báo cáo',
            REPORT_ASSIGN: 'Phân công báo cáo',
            LISTING_APPROVE: 'Duyệt tin đăng',
            LISTING_REJECT: 'Từ chối tin đăng',
            LISTING_HIDE: 'Ẩn tin đăng',
            LISTING_UNHIDE: 'Hiện lại tin đăng',
            USER_BAN: 'Khóa tài khoản',
            USER_UNBAN: 'Mở khóa tài khoản',
            USER_WARN: 'Cảnh báo người dùng',
            COMMENT_HIDE: 'Ẩn bình luận',
            COMMENT_UNHIDE: 'Hiện bình luận',
            SYSTEM_CONFIG_UPDATE: 'Cập nhật cấu hình hệ thống',
        }[log.action] || log.action?.replaceAll('_', ' ').toLowerCase() || 'Hành động';

    const entityLabel =
        {
            REPORT: 'Báo cáo',
            LISTING: 'Tin đăng',
            USER: 'Người dùng',
            COMMENT: 'Bình luận',
            DEAL: 'Giao dịch',
            CATEGORY: 'Danh mục',
            SYSTEM: 'Hệ thống',
        }[log.entityType] || log.entityType?.replaceAll('_', ' ').toLowerCase() || '';

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1.5,
                py: 1.25,
                borderBottom: `1px solid ${BORDER}`,
                '&:last-child': { borderBottom: 'none' },
                alignItems: 'flex-start',
            }}
        >
            <Box
                sx={{
                    mt: 0.25,
                    minWidth: 7,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: PALETTE.blue,
                    flexShrink: 0,
                }}
            />
            <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: TEXT, fontWeight: 600, lineHeight: 1.4 }}>
                    {actionLabel}
                    {entityLabel ? ` — ${entityLabel}` : ''}
                    {log.entityId ? ` #${log.entityId}` : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                    {timeStr}
                </Typography>
            </Box>
        </Box>
    );
}

const GROWTH_SERIES = [
    { key: 'users', name: 'Người dùng mới', color: PALETTE.blue },
    { key: 'listings', name: 'Tin đăng mới', color: PALETTE.green },
    { key: 'deals', name: 'Giao dịch mới', color: PALETTE.orange },
    { key: 'reports', name: 'Báo cáo mới', color: PALETTE.red },
];

const CAT_COLORS = [PALETTE.blue, PALETTE.purple, PALETTE.teal, PALETTE.pink, PALETTE.indigo];

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await getAdminDashboard();
            const payload = data?.data ?? data;
            if (payload && typeof payload.listingCount === 'number') setStats(payload);
        } catch {
            /* silent */
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchCharts = useCallback(async () => {
        try {
            const { data } = await getAdminDashboardCharts();
            const payload = data?.data ?? data;
            if (payload) setCharts(payload);
        } catch {
            /* silent */
        } finally {
            setChartsLoading(false);
        }
    }, []);

    const fetchAudit = useCallback(async () => {
        try {
            const { data } = await getAdminAuditLog(10);
            const payload = data?.data ?? data;
            const rows = payload?.content ?? (Array.isArray(payload) ? payload : []);
            setAuditLogs(rows);
        } catch {
            /* silent */
        }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchCharts();
        fetchAudit();
        const id = window.setInterval(fetchStats, POLL_MS);
        return () => window.clearInterval(id);
    }, [fetchStats, fetchCharts, fetchAudit]);

    const listingStatusData = stats
        ? [
            { name: 'Đang hiển thị', value: stats.listingActive, color: PALETTE.green },
            { name: 'Đang ẩn', value: stats.listingHidden + (stats.listingModHidden ?? 0), color: PALETTE.orange },
            { name: 'Hết hạn', value: stats.listingExpired, color: PALETTE.red },
            { name: 'Bản nháp', value: stats.listingDraft, color: 'rgba(255,255,255,0.25)' },
        ]
        : [];

    const userStatusData = stats
        ? [
            { name: 'Hoạt động', value: stats.userActive, color: PALETTE.green },
            { name: 'Bị khóa', value: stats.userBanned, color: PALETTE.red },
            { name: 'Hạn chế', value: stats.userRestricted, color: PALETTE.orange },
        ]
        : [];

    const dealStatusData = stats
        ? [
            { name: 'Đang chờ', value: stats.dealPending, color: PALETTE.orange },
            { name: 'Đã xác nhận', value: stats.dealConfirmed, color: PALETTE.blue },
            { name: 'Hoàn thành', value: stats.dealCompleted, color: PALETTE.green },
            { name: 'Đã hủy', value: stats.dealCancelled, color: PALETTE.red },
        ]
        : [];

    const reportStatusData = stats
        ? [
            { name: 'Chờ xử lý', value: stats.reportPending, color: PALETTE.orange },
            { name: 'Đã xử lý', value: stats.reportResolved, color: PALETTE.green },
            { name: 'Từ chối', value: stats.reportRejected, color: PALETTE.red },
        ]
        : [];

    const growthData = useMemo(() => {
        if (!charts) return [];
        const byDate = {};
        for (const { date, count } of charts.userGrowth ?? []) {
            byDate[date] = { date, users: count, listings: 0, deals: 0, reports: 0 };
        }
        for (const { date, count } of charts.listingGrowth ?? []) {
            if (!byDate[date]) byDate[date] = { date, users: 0, listings: 0, deals: 0, reports: 0 };
            byDate[date].listings = count;
        }
        for (const { date, count } of charts.dealTrend ?? []) {
            if (!byDate[date]) byDate[date] = { date, users: 0, listings: 0, deals: 0, reports: 0 };
            byDate[date].deals = count;
        }
        for (const { date, count } of charts.reportTrend ?? []) {
            if (!byDate[date]) byDate[date] = { date, users: 0, listings: 0, deals: 0, reports: 0 };
            byDate[date].reports = count;
        }
        return Object.values(byDate)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((d) => ({ ...d, dateShort: d.date.slice(5) }));
    }, [charts]);

    const topCatData = (stats?.topCategories ?? []).map((c, i) => ({
        name: c.name?.length > 22 ? `${c.name.slice(0, 21)}…` : c.name,
        value: c.listingCount,
        color: CAT_COLORS[i % CAT_COLORS.length],
    }));

    return (
        <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={4} md={3} lg={3}>
                    <StatCard
                        icon={<DescriptionIcon fontSize="small" />}
                        label="Tổng tin đăng"
                        value={fmt(stats?.listingCount)}
                        sub={`${fmt(stats?.listingActive)} đang hiển thị`}
                        color={PALETTE.blue}
                        loading={statsLoading}
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={3}>
                    <StatCard
                        icon={<ManageAccountsIcon fontSize="small" />}
                        label="Người dùng"
                        value={fmt(stats?.userCount)}
                        sub={`${fmt(stats?.userBanned)} bị khóa`}
                        color={PALETTE.orange}
                        loading={statsLoading}
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={3}>
                    <StatCard
                        icon={<FlagIcon fontSize="small" />}
                        label="Báo cáo"
                        value={fmt(stats?.reportCount)}
                        sub={`${fmt(stats?.reportPending)} chờ xử lý`}
                        color={PALETTE.red}
                        loading={statsLoading}
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={3}>
                    <StatCard
                        icon={<HandshakeOutlinedIcon fontSize="small" />}
                        label="Giao dịch"
                        value={fmt(
                            (stats?.dealPending ?? 0) +
                            (stats?.dealConfirmed ?? 0) +
                            (stats?.dealCompleted ?? 0) +
                            (stats?.dealCancelled ?? 0),
                        )}
                        sub={`${fmt(stats?.dealCompleted)} hoàn thành`}
                        color={PALETTE.green}
                        loading={statsLoading}
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={3}>
                    <StatCard
                        icon={<CategoryIcon fontSize="small" />}
                        label="Danh mục"
                        value={fmt(stats?.categoryCount)}
                        color={PALETTE.purple}
                        loading={statsLoading}
                    />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={3}>
                    <StatCard
                        icon={<PersonOffOutlinedIcon fontSize="small" />}
                        label="Người dùng bị khóa"
                        value={fmt(stats?.userBanned)}
                        sub={`${fmtPct(stats?.userBanned, stats?.userCount)} tổng users`}
                        color={PALETTE.pink}
                        loading={statsLoading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12}>
                    <Section title="Phân bổ tin đăng" minHeight={320}>
                        {statsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : (
                            <>
                                <DonutChart segments={listingStatusData} size={168} />
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        justifyContent: 'center',
                                        mt: 2,
                                    }}
                                >
                                    {listingStatusData.map((d) => (
                                        <Box
                                            key={d.name}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                minWidth: 132,
                                                maxWidth: '48%',
                                            }}
                                        >
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                                            <Typography variant="caption" sx={{ color: TEXT_MUTED }} noWrap>
                                                {d.name} ({fmt(d.value)})
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}
                    </Section>
                </Grid>
            </Grid>

            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6} lg={4}>
                    <Section title="Giao dịch theo trạng thái" minHeight={280}>
                        {statsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : dealStatusData.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                Chưa có giao dịch
                            </Typography>
                        ) : (
                            <VerticalBarChart items={dealStatusData} height={180} />
                        )}
                    </Section>
                </Grid>

                <Grid item xs={12} sm={6} lg={4}>
                    <Section title="Trạng thái người dùng" minHeight={280}>
                        {statsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : (
                            <>
                                <DonutChart segments={userStatusData} size={140} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1.5 }}>
                                    {userStatusData.map((d) => (
                                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                                            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                                                {d.name} ({fmt(d.value)})
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}
                    </Section>
                </Grid>

                <Grid item xs={12} sm={6} lg={4}>
                    <Section title="Trạng thái báo cáo" minHeight={280}>
                        {statsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : (
                            <>
                                <DonutChart segments={reportStatusData} size={140} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1.5 }}>
                                    {reportStatusData.map((d) => (
                                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                                            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                                                {d.name} ({fmt(d.value)})
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}
                    </Section>
                </Grid>
            </Grid>

            <Grid container spacing={2.5}>
                <Grid item xs={12} lg={5}>
                    <Section title="Top 5 danh mục (theo tin ACTIVE)">
                        {statsLoading ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                                ))}
                            </Box>
                        ) : topCatData.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                Chưa có dữ liệu
                            </Typography>
                        ) : (
                            <HorizontalBarChart items={topCatData} />
                        )}
                    </Section>
                </Grid>

                <Grid item xs={12} lg={7}>
                    <Section title="Hoạt động admin gần nhất">
                        {auditLogs.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                Chưa có lịch sử hành động
                            </Typography>
                        ) : (
                            auditLogs.map((log) => <AuditRow key={log.id} log={log} />)
                        )}
                    </Section>
                </Grid>
            </Grid>
        </Box>
    );
}
