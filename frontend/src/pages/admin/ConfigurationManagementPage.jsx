/** Mục đích: Trang cấu hình hệ thống (admin). Tạm thời dữ liệu hardcode — sau nối GET/PATCH /api/admin/configurations. */
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useToast } from '../../context/ToastContext';
import { DARK_DIALOG_PAPER_PROPS } from '../../components/common/dialogStyles';

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

/** Khóa cấu hình — khớp nghiệp vụ tài liệu (listing expiration, max images, report threshold, deal timeout). */
export const HARDCODED_SYSTEM_CONFIGS = [
    {
        config_id: 1,
        config_name: 'LISTING_EXPIRATION_DAYS',
        config_value: '30',
        description: 'Số ngày tin đăng được hiển thị công khai trước khi hết hạn.',
        updated_by: 'admin@slife.local',
        created_at: '2025-01-10T08:00:00.000Z',
        updated_at: '2025-03-18T14:22:00.000Z',
        deleted_at: null,
    },
    {
        config_id: 2,
        config_name: 'MAX_IMAGES_PER_LISTING',
        config_value: '8',
        description: 'Số lượng ảnh tối đa cho mỗi tin đăng.',
        updated_by: 'admin@slife.local',
        created_at: '2025-01-10T08:00:00.000Z',
        updated_at: '2025-02-01T09:15:00.000Z',
        deleted_at: null,
    },
    {
        config_id: 3,
        config_name: 'REPORT_THRESHOLD',
        config_value: '5',
        description:
            'Tự động khóa tài khoản sau khi tích lũy đủ n lần vi phạm (n là giá trị cấu hình ở cột Giá trị).',
        updated_by: 'moderator@slife.local',
        created_at: '2025-01-10T08:00:00.000Z',
        updated_at: '2025-03-20T11:00:00.000Z',
        deleted_at: null,
    },
    {
        config_id: 4,
        config_name: 'DEAL_TIMEOUT_MINUTES',
        config_value: '120',
        description: 'Thời gian chờ tối đa (phút) để hoàn tất thỏa thuận giao dịch.',
        updated_by: 'admin@slife.local',
        created_at: '2025-01-10T08:00:00.000Z',
        updated_at: '2025-03-12T16:45:00.000Z',
        deleted_at: null,
    },
];

const CONFIG_LABELS = {
    LISTING_EXPIRATION_DAYS: 'Hạn hiển thị tin đăng',
    MAX_IMAGES_PER_LISTING: 'Số ảnh tối đa / tin',
    REPORT_THRESHOLD: 'Ngưỡng báo cáo',
    DEAL_TIMEOUT_MINUTES: 'Thời gian chờ giao dịch',
};

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
    LISTING_EXPIRATION_DAYS: {
        unit: 'ngày',
        validate: (raw) =>
            validateConfigInt(raw, 1, 365, 'Giá trị hợp lệ: 1–365 ngày.'),
    },
    MAX_IMAGES_PER_LISTING: {
        unit: 'ảnh',
        validate: (raw) => validateConfigInt(raw, 1, 30, 'Giá trị hợp lệ: 1–30 ảnh.'),
    },
    REPORT_THRESHOLD: {
        unit: 'lần',
        validate: (raw) => validateConfigInt(raw, 1, 100, 'Giá trị hợp lệ: 1–100.'),
    },
    DEAL_TIMEOUT_MINUTES: {
        unit: 'phút',
        validate: (raw) =>
            validateConfigInt(raw, 5, 10080, 'Giá trị hợp lệ: 5–10080 phút (tối đa 7 ngày).'),
    },
};

function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function cloneConfigs(list) {
    return list.map((row) => ({ ...row }));
}

export default function ConfigurationManagementPage() {
    const [rows, setRows] = useState(() => cloneConfigs(HARDCODED_SYSTEM_CONFIGS));
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draftValue, setDraftValue] = useState('');
    const [fieldError, setFieldError] = useState('');
    const { showToast } = useToast();
    const [deleteTarget, setDeleteTarget] = useState(null);

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

    const handleSave = useCallback(() => {
        if (!editing) return;
        const key = editing.config_name;
        const validator = VALIDATORS[key];
        if (!validator) {
            setFieldError('Không có quy tắc kiểm tra cho khóa này.');
            return;
        }
        const result = validator.validate(draftValue);
        if (!result.ok) {
            setFieldError(result.message);
            return;
        }
        const now = new Date().toISOString();
        setRows((prev) =>
            prev.map((r) =>
                r.config_id === editing.config_id
                    ? {
                        ...r,
                        config_value: result.value,
                        updated_at: now,
                        updated_by: 'admin@slife.local',
                    }
                    : r,
            ),
        );
        showToast('Đã cập nhật (mock — chưa gửi API).', 'success');
        closeEdit();
    }, [editing, draftValue, closeEdit]);

    const editingMeta = useMemo(() => {
        if (!editing) return null;
        return VALIDATORS[editing.config_name];
    }, [editing]);

    const openDeleteConfirm = useCallback((row) => {
        setDeleteTarget(row);
    }, []);

    const closeDeleteConfirm = useCallback(() => {
        setDeleteTarget(null);
    }, []);

    const confirmDeleteRow = useCallback(() => {
        if (!deleteTarget) return;
        const id = deleteTarget.config_id;
        setRows((prev) => prev.filter((r) => r.config_id !== id));
        if (editing?.config_id === id) closeEdit();
        showToast('Đã xóa dòng (mock — chưa gọi API).', 'success');
        setDeleteTarget(null);
    }, [deleteTarget, editing, closeEdit, showToast]);

    return (
        <Box>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2, gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
                        Cấu hình hệ thống
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 640 }}>
                        Quản lý tham số áp dụng toàn hệ thống (hạn tin, ảnh, báo cáo, giao dịch). Hiện chỉ hiển thị
                        dữ liệu tĩnh trên trình duyệt.
                    </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    <SettingsSuggestIcon fontSize="small" />
                    <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Mock data
                    </Typography>
                </Stack>
            </Stack>

            <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(59,130,246,0.12)', color: 'rgba(255,255,255,0.9)' }}>
                Đang dùng dữ liệu hardcode — thay đổi chỉ có hiệu lực trong phiên làm việc. Khi backend sẵn sàng, sẽ đồng
                bộ qua API admin.
            </Alert>

            <TableContainer sx={tableContainerSx}>
                <Table size="medium" sx={tableSx}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên hiển thị</TableCell>
                            <TableCell align="right">Giá trị</TableCell>
                            <TableCell>Mô tả</TableCell>
                            <TableCell>Cập nhật bởi</TableCell>
                            <TableCell>Cập nhật lúc</TableCell>
                            <TableCell align="center" width={120}>
                                Thao tác
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.55)' }}>
                                    Chưa có dòng cấu hình. Tải lại trang để khôi phục dữ liệu mock.
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
                                <TableCell sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 280 }}>
                                    {row.description}
                                </TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{row.updated_by ?? '—'}</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
                                    {formatDateTime(row.updated_at)}
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={0} justifyContent="center" alignItems="center">
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
                                        <Tooltip title="Xóa dòng (mock)">
                                            <IconButton
                                                size="small"
                                                onClick={() => openDeleteConfirm(row)}
                                                sx={{ color: 'rgba(248,113,113,0.95)' }}
                                                aria-label="Xóa cấu hình"
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'rgba(255,255,255,0.45)' }}>
                Cột ẩn trong DB (soft delete): <code style={{ color: 'rgba(167,139,250,0.9)' }}>deleted_at</code> — bản
                ghi mock đều đang hoạt động (null).
            </Typography>

            <Dialog
                open={editOpen}
                onClose={closeEdit}
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
                    <Button onClick={closeEdit} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Hủy
                    </Button>
                    <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(deleteTarget)}
                onClose={closeDeleteConfirm}
                PaperProps={DARK_DIALOG_PAPER_PROPS}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Xóa cấu hình?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                        Xóa «
                        {deleteTarget
                            ? CONFIG_LABELS[deleteTarget.config_name] || deleteTarget.config_name
                            : ''}
                        » khỏi bảng? Chỉ áp dụng trong phiên (mock).
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDeleteConfirm} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmDeleteRow}
                        sx={{ bgcolor: '#b91c1c', '&:hover': { bgcolor: '#991b1b' } }}
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}