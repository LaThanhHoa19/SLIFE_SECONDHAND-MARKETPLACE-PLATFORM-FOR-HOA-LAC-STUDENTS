import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useToast } from '../../context/ToastContext';
import { DARK_DIALOG_PAPER_PROPS } from '../../components/common/dialogStyles';
import { getAdminConfigurations, updateAdminConfigurations } from '../../api/configApi';

const TABLE_SURFACE = '#19191B';
const TABLE_BORDER = '#3E3E42';

const tableContainerSx = {
    bgcolor: TABLE_SURFACE,
    border: `1px solid ${TABLE_BORDER}`,
    borderRadius: 1,
    boxShadow: 'none',
};

const tableSx = {
    '& thead th': {
        color: 'rgba(255,255,255,0.88)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderBottom: `1px solid ${TABLE_BORDER}`,
        fontWeight: 700,
        fontSize: 13,
    },
    '& tbody td': {
        color: '#ffffff',
        borderBottom: `1px solid ${TABLE_BORDER}`,
        fontSize: 14,
    },
    '& .MuiTableCell-root:not(:last-of-type)': {
        borderRight: `1px solid ${TABLE_BORDER}`,
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
};

/** Khớp khóa trong DB / ConfigService (chuẩn hóa UPPER_SNAKE). */
const CONFIG_LABELS = {
    LISTING_EXPIRATION: 'Hạn hiển thị tin đăng',
    MAX_IMAGES: 'Giới hạn ảnh (hệ thống)',
    MAX_IMAGES_PER_POST: 'Số ảnh tối đa / tin',
    REPORT_THRESHOLD: 'Ngưỡng báo cáo',
    DEAL_TIMEOUT_DAYS: 'Thời gian chờ giao dịch',
};

/** Khóa backend yêu cầu giá trị số nguyên (khớp ConfigService.NUMERIC_CONFIG_KEYS). */
const BACKEND_NUMERIC_KEYS = new Set([
    'MAX_IMAGES',
    'LISTING_EXPIRATION',
    'MAX_IMAGES_PER_POST',
    'DEAL_TIMEOUT_DAYS',
    'REPORT_THRESHOLD',
]);

/** Số nguyên ≥ 0, trong [min, max]; không cho số âm (kể cả chuỗi "-1"). */
function validateConfigInt(raw, min, max, rangeHint) {
    const s = String(raw ?? '').trim();
    if (s === '') return { ok: false, message: 'Vui lòng nhập giá trị.' };
    if (/^-/.test(s)) return { ok: false, message: 'Không được nhập số âm.' };
    const n = Number.parseInt(s, 10);
    if (Number.isNaN(n)) return { ok: false, message: 'Chỉ nhập số nguyên.' };
    if (n < 0) return { ok: false, message: 'Không được nhập số âm.' };
    if (n < min || n > max) return { ok: false, message: rangeHint };
    return { ok: true, value: String(n) };
}

const VALIDATORS = {
    LISTING_EXPIRATION: {
        unit: 'ngày',
        validate: (raw) =>
            validateConfigInt(raw, 1, 365, 'Giá trị hợp lệ: 1–365 ngày.'),
    },
    MAX_IMAGES: {
        unit: 'ảnh',
        validate: (raw) => validateConfigInt(raw, 1, 30, 'Giá trị hợp lệ: 1–30 ảnh.'),
    },
    MAX_IMAGES_PER_POST: {
        unit: 'ảnh',
        validate: (raw) => validateConfigInt(raw, 1, 30, 'Giá trị hợp lệ: 1–30 ảnh.'),
    },
    REPORT_THRESHOLD: {
        unit: 'lần',
        validate: (raw) => validateConfigInt(raw, 1, 100, 'Giá trị hợp lệ: 1–100.'),
    },
    DEAL_TIMEOUT_DAYS: {
        unit: 'ngày',
        validate: (raw) =>
            validateConfigInt(raw, 1, 365, 'Giá trị hợp lệ: 1–365 ngày (theo DEAL_TIMEOUT_DAYS).'),
    },
};

function validateConfigValue(key, raw) {
    const specific = VALIDATORS[key];
    if (specific) return specific.validate(raw);
    if (BACKEND_NUMERIC_KEYS.has(key)) {
        const s = String(raw ?? '').trim();
        if (s === '') return { ok: false, message: 'Vui lòng nhập giá trị.' };
        const n = Number.parseInt(s, 10);
        if (Number.isNaN(n)) return { ok: false, message: 'Chỉ nhập số nguyên.' };
        return { ok: true, value: String(n) };
    }
    const s = String(raw ?? '').trim();
    if (!s) return { ok: false, message: 'Không được để trống.' };
    return { ok: true, value: s };
}

function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function extractConfigurationList(response) {
    const payload = response?.data?.data;
    return Array.isArray(payload) ? payload : [];
}

function mapDtoToRow(dto, index) {
    const key = dto.configKey ?? dto.config_key ?? `row-${index}`;
    return {
        config_id: key,
        config_name: key,
        config_value: dto.configValue ?? dto.config_value ?? '',
        description: dto.description ?? '',
        updated_at: dto.lastUpdated ?? dto.last_updated ?? null,
        updated_by: null,
    };
}

export default function ConfigurationManagementPage() {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draftValue, setDraftValue] = useState('');
    const [fieldError, setFieldError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const loadConfigs = useCallback(async () => {
        try {
            setIsLoading(true);
            setLoadError('');
            const response = await getAdminConfigurations();
            const list = extractConfigurationList(response).map(mapDtoToRow);
            setRows(list);
        } catch (error) {
            setLoadError(error?.message || 'Không tải được cấu hình.');
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfigs();
    }, [loadConfigs]);

    const openEdit = useCallback((row) => {
        setEditing(row);
        setDraftValue(row.config_value ?? '');
        setFieldError('');
        setEditOpen(true);
    }, []);

    const closeEdit = useCallback(() => {
        setEditOpen(false);
        setEditing(null);
        setDraftValue('');
        setFieldError('');
    }, []);

    const handleSave = useCallback(async () => {
        if (!editing) return;
        const key = editing.config_name;
        const result = validateConfigValue(key, draftValue);
        if (!result.ok) {
            setFieldError(result.message);
            return;
        }
        try {
            setIsSaving(true);
            await updateAdminConfigurations([{ key, value: result.value }]);
            showToast('Đã cập nhật cấu hình.', 'success');
            closeEdit();
            await loadConfigs();
        } catch (error) {
            showToast(error?.message || 'Không lưu được cấu hình.', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [editing, draftValue, closeEdit, loadConfigs, showToast]);

    const editingMeta = useMemo(() => {
        if (!editing) return null;
        return VALIDATORS[editing.config_name];
    }, [editing]);

    return (
        <Box>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
                        Cấu hình hệ thống
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 640 }}>
                        Tham số toàn hệ thống (đồng bộ với server qua API admin).
                    </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={loadConfigs}
                        disabled={isLoading}
                        sx={{ borderRadius: 999, textTransform: 'none', color: '#e9d5ff', borderColor: 'rgba(233,213,255,0.35)' }}
                    >
                        Tải lại
                    </Button>
                    <SettingsSuggestIcon sx={{ color: 'rgba(255,255,255,0.45)' }} fontSize="small" />
                </Stack>
            </Stack>

            {loadError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {loadError}
                </Alert>
            ) : null}

            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                    <CircularProgress sx={{ color: '#a78bfa' }} />
                </Box>
            ) : (
                <TableContainer sx={tableContainerSx}>
                    <Table size="medium" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Tên hiển thị</TableCell>
                                <TableCell align="right">Giá trị</TableCell>
                                <TableCell>Mô tả</TableCell>
                                <TableCell>Cập nhật lúc</TableCell>
                                <TableCell align="center" width={100}>
                                    Thao tác
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.55)' }}>
                                        Chưa có bản ghi cấu hình trên server. Có thể thêm bản ghi qua cơ sở dữ liệu hoặc lần
                                        cập nhật PUT sẽ tạo mới theo khóa (theo backend).
                                    </TableCell>
                                </TableRow>
                            ) : null}
                            {rows.map((row) => (
                                <TableRow key={row.config_id}>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.92)' }}>
                                        {CONFIG_LABELS[row.config_name] ?? row.config_name}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        {row.config_value}
                                        {VALIDATORS[row.config_name]?.unit ? (
                                            <Typography component="span" variant="caption" sx={{ ml: 0.5, opacity: 0.65 }}>
                                                {VALIDATORS[row.config_name].unit}
                                            </Typography>
                                        ) : null}
                                    </TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 320 }}>
                                        {row.description || '—'}
                                    </TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
                                        {formatDateTime(row.updated_at)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Chỉnh sửa giá trị">
                                            <IconButton
                                                size="small"
                                                onClick={() => openEdit(row)}
                                                sx={{ color: '#a78bfa' }}
                                                aria-label="Sửa cấu hình"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'rgba(255,255,255,0.45)' }}>
                API: <code style={{ color: 'rgba(167,139,250,0.9)' }}>GET/PUT /api/admin/configurations</code>
                {' '}(yêu cầu quyền ADMIN).
            </Typography>

            <Dialog
                open={editOpen}
                onClose={isSaving ? undefined : closeEdit}
                fullWidth
                maxWidth="sm"
                PaperProps={DARK_DIALOG_PAPER_PROPS}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {editing ? CONFIG_LABELS[editing.config_name] || editing.config_name : 'Sửa cấu hình'}
                </DialogTitle>
                <DialogContent>
                    {editing && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                Khóa: <strong style={{ color: '#e9d5ff' }}>{editing.config_name}</strong>
                            </Typography>
                            <TextField
                                label="Giá trị mới"
                                value={draftValue}
                                onChange={(e) => {
                                    setDraftValue(e.target.value);
                                    if (fieldError) setFieldError('');
                                }}
                                error={Boolean(fieldError)}
                                helperText={fieldError || `Nhập số (${editingMeta?.unit || 'đơn vị'}), không dùng số âm.`}
                                fullWidth
                                autoFocus
                                disabled={isSaving}
                                inputProps={{
                                    inputMode: 'numeric',
                                    onKeyDown: (e) => {
                                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                                            e.preventDefault();
                                        }
                                    },
                                }}
                                InputProps={{
                                    endAdornment: editingMeta?.unit ? (
                                        <InputAdornment position="end">
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                {editingMeta.unit}
                                            </Typography>
                                        </InputAdornment>
                                    ) : null,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff' },
                                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeEdit} disabled={isSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={isSaving}
                        sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                    >
                        {isSaving ? 'Đang lưu…' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
