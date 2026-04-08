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
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Pagination,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useToast } from '../../context/ToastContext';
import { DARK_DIALOG_PAPER_PROPS, DARK_DIALOG_TEXTFIELD_SX } from '../../components/common/dialogStyles';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
    getAdminConfigurations,
    updateAdminConfigurationById,
    updateAdminConfigurations,
} from '../../api/configApi';
import {
    extractApiErrorMessage,
    getValidationHint,
    isIntegerValidation,
    mapApiValidationErrors,
    sanitizeUnsignedIntegerInput,
    validateConfigByMeta,
    withSourcePrefix,
} from './configValidation';

const TABLE_SURFACE = '#19191B';
const TABLE_BORDER = '#3E3E42';

/** Khớp backend `ConfigUpdateRequest` / `ConfigSingleUpdateRequest` (@Size max 4000). */
const DESCRIPTION_MAX_LENGTH = 4000;
/** Số dòng mỗi trang — cùng cách làm Quản lý người dùng. */
const PAGE_SIZE = 10;

const tableContainerSx = {
    bgcolor: TABLE_SURFACE,
    border: `1px solid ${TABLE_BORDER}`,
    borderRadius: 1,
    boxShadow: 'none',
    maxHeight: 560,
};

const tableSx = {
    '& thead th': {
        color: 'rgba(255,255,255,0.88)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderBottom: `1px solid ${TABLE_BORDER}`,
        fontWeight: 700,
        fontSize: 13,
        position: 'sticky',
        top: 0,
        zIndex: 2,
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

/** Cùng tông thanh search Quản lý người dùng */
const SEARCH_BORDER = '#9D6EED';
const SEARCH_FOCUS_GLOW = '0 0 0 3px rgba(157, 110, 237, 0.22)';

const searchFieldSx = {
    flex: { xs: 'none', sm: '1 1 260px' },
    minWidth: { xs: '100%', sm: 260 },
    maxWidth: { md: 440 },
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.25)',
        '& fieldset': { borderColor: SEARCH_BORDER, borderWidth: 1 },
        '&:hover fieldset': { borderColor: SEARCH_BORDER },
        '&.Mui-focused': {
            boxShadow: SEARCH_FOCUS_GLOW,
        },
        '&.Mui-focused fieldset, &.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: SEARCH_BORDER,
            borderWidth: 1,
        },
    },
    '& .MuiOutlinedInput-input::placeholder': {
        color: 'rgba(255,255,255,0.42)',
        opacity: 1,
    },
    '& .MuiOutlinedInput-input': {
        outline: 'none',
        '&:focus': { outline: 'none', boxShadow: 'none' },
        '&:focus-visible': { outline: 'none', boxShadow: 'none' },
    },
    '& .MuiInputAdornment-root': { color: 'rgba(255,255,255,0.4)' },
};

const selectFieldSx = {
    minWidth: 220,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: TABLE_BORDER },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
    '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.7)' },
    '& .MuiSelect-select': { color: '#fff' },
};

/** Khớp khóa trong DB / ConfigService (chuẩn hóa UPPER_SNAKE). */
const CONFIG_LABELS = {
    LISTING_EXPIRATION: 'Hạn hiển thị tin đăng',
    MAX_IMAGES: 'Giới hạn ảnh (hệ thống)',
    MAX_IMAGES_PER_POST: 'Số ảnh tối đa / tin',
    REPORT_THRESHOLD: 'Ngưỡng báo cáo',
    DEAL_TIMEOUT_DAYS: 'Thời gian chờ giao dịch',
    AUTO_HIDE_REPORT_THRESHOLD: 'Ngưỡng tự ẩn theo báo cáo',
    PICKUP_REMINDER_HOURS: 'Giờ nhắc trước giờ nhận hàng (email)',
    MAX_ACTIVE_LISTINGS_PER_USER: 'Số tin ACTIVE tối đa / người',
    LISTING_EXPIRING_SOON_HOURS_BEFORE: 'Giờ trước khi hết hạn — gửi mail nhắc',
};

const SUPPORTED_CONFIG_KEYS = new Set(Object.keys(CONFIG_LABELS));

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
    const rawId = dto.id;
    const id = rawId != null && rawId !== '' ? Number(rawId) : null;
    return {
        id: Number.isFinite(id) ? id : null,
        config_id: key,
        config_name: key,
        config_value: dto.configValue ?? dto.config_value ?? '',
        description: dto.description ?? '',
        updated_at: dto.lastUpdated ?? dto.last_updated ?? null,
        validation: dto.validation ?? null,
        updated_by: null,
    };
}

function getDisplayLabel(row) {
    return CONFIG_LABELS[row.config_name] ?? row.config_name ?? '';
}

function isSupportedKey(row) {
    return SUPPORTED_CONFIG_KEYS.has(row.config_name);
}

function configMatchesSearch(row, rawQuery) {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    const label = String(getDisplayLabel(row)).toLowerCase();
    const desc = String(row.description ?? '').toLowerCase();
    const key = String(row.config_name ?? '').toLowerCase();
    const idStr = row.id != null ? String(row.id) : '';
    return label.includes(q) || desc.includes(q) || key.includes(q) || idStr.includes(q);
}

function parseUpdatedAtMs(row) {
    const raw = row.updated_at;
    if (!raw) return null;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? null : t;
}

/** Thứ tự như DB: `config_id` tăng dần — bản ghi mới (ID lớn hơn) nằm cuối. */
function compareByConfigIdAsc(a, b) {
    const idA = a.id;
    const idB = b.id;
    if (idA == null && idB == null) {
        return String(a.config_name ?? '').localeCompare(String(b.config_name ?? ''));
    }
    if (idA == null) return 1;
    if (idB == null) return -1;
    return idA - idB;
}

export default function ConfigurationManagementPage() {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draftValue, setDraftValue] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [fieldError, setFieldError] = useState('');
    const [descriptionError, setDescriptionError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    /** `default` = theo ID tăng dần (như DB); `desc` / `asc` = theo cập nhật lúc */
    const [sortUpdatedDir, setSortUpdatedDir] = useState('default');
    const [page, setPage] = useState(0);
    const { showToast } = useToast();

    const loadConfigs = useCallback(async () => {
        try {
            setIsLoading(true);
            setLoadError('');
            setPage(0);
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
        setDraftDescription(row.description ?? '');
        setFieldError('');
        setDescriptionError('');
        setEditOpen(true);
    }, []);

    const closeEdit = useCallback(() => {
        setEditOpen(false);
        setEditing(null);
        setDraftValue('');
        setDraftDescription('');
        setFieldError('');
        setDescriptionError('');
    }, []);


    const handleSave = useCallback(async () => {
        if (!editing) return;
        const key = editing.config_name;
        const result = validateConfigByMeta(editing.validation, draftValue);
        if (!result.ok) {
            setFieldError(withSourcePrefix(result.message, 'client'));
            return;
        }

        const trimmedDescription = draftDescription.trim();
        if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
            setDescriptionError(withSourcePrefix(`Mô tả tối đa ${DESCRIPTION_MAX_LENGTH} ký tự.`, 'client'));
            return;
        }

        try {
            setIsSaving(true);
            setFieldError('');
            setDescriptionError('');

            if (editing.id != null) {
                await updateAdminConfigurationById(editing.id, {
                    value: result.value,
                    description: trimmedDescription,
                });
            } else {
                // Fallback for legacy records without numeric id.
                await updateAdminConfigurations([
                    { key, value: result.value, description: trimmedDescription },
                ]);
            }
            showToast('Đã cập nhật cấu hình.', 'success');
            closeEdit();
            await loadConfigs();
        } catch (error) {
            const mapped = mapApiValidationErrors(error, key);
            if (mapped.valueError || mapped.descriptionError) {
                if (mapped.valueError) setFieldError(withSourcePrefix(mapped.valueError, 'server'));
                if (mapped.descriptionError) setDescriptionError(withSourcePrefix(mapped.descriptionError, 'server'));
                if (!mapped.valueError && !mapped.descriptionError && mapped.topMessage) {
                    showToast(withSourcePrefix(mapped.topMessage, 'server'), 'error');
                }
                return;
            }
            showToast(
                withSourcePrefix(extractApiErrorMessage(error, 'Không lưu được cấu hình.'), 'server'),
                'error',
            );
        } finally {
            setIsSaving(false);
        }
    }, [editing, draftValue, draftDescription, closeEdit, loadConfigs, showToast]);

    const hasDraftChanges = useMemo(() => {
        if (!editing) return false;

        const currentDescription = String(editing.description ?? '').trim();
        const nextDescription = String(draftDescription ?? '').trim();
        const descriptionChanged = currentDescription !== nextDescription;

        if (isIntegerValidation(editing.validation)) {
            const currentValue = String(editing.config_value ?? '').trim();
            const nextValue = sanitizeUnsignedIntegerInput(draftValue).trim();
            return descriptionChanged || currentValue !== nextValue;
        }

        const currentValue = String(editing.config_value ?? '').trim();
        const nextValue = String(draftValue ?? '').trim();
        return descriptionChanged || currentValue !== nextValue;
    }, [editing, draftValue, draftDescription]);

    const valueHelperText = useMemo(() => {
        if (fieldError) return fieldError;
        if (!editing) return undefined;
        return getValidationHint(editing.validation) || 'Nhập giá trị.';
    }, [fieldError, editing]);

    const saveDisabledReason = useMemo(() => {
        if (isSaving) return 'Đang lưu...';
        if (!hasDraftChanges) return 'Chưa có thay đổi';
        return '';
    }, [isSaving, hasDraftChanges]);

    const handleDialogClose = useCallback(() => {
        if (isSaving) return;
        if (hasDraftChanges) {
            setDiscardConfirmOpen(true);
            return;
        }
        closeEdit();
    }, [isSaving, hasDraftChanges, closeEdit]);

    const handleConfirmDiscardChanges = useCallback(() => {
        setDiscardConfirmOpen(false);
        closeEdit();
    }, [closeEdit]);

    const handleCancelDiscardChanges = useCallback(() => {
        if (isSaving) return;
        setDiscardConfirmOpen(false);
    }, [isSaving]);

    const sortedFilteredRows = useMemo(() => {
        const filtered = rows.filter((r) => configMatchesSearch(r, searchQuery));
        if (sortUpdatedDir === 'default') {
            return [...filtered].sort(compareByConfigIdAsc);
        }
        return [...filtered].sort((a, b) => {
            const ta = parseUpdatedAtMs(a);
            const tb = parseUpdatedAtMs(b);
            if (ta == null && tb == null) {
                return String(a.config_name ?? '').localeCompare(String(b.config_name ?? ''));
            }
            if (ta == null) return 1;
            if (tb == null) return -1;
            const delta = ta - tb;
            return sortUpdatedDir === 'desc' ? -delta : delta;
        });
    }, [rows, searchQuery, sortUpdatedDir]);

    const totalCount = sortedFilteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE) || 1);

    const pagedRows = useMemo(
        () => sortedFilteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
        [sortedFilteredRows, page],
    );

    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
        if (page > maxPage) setPage(maxPage);
    }, [totalCount, page]);

    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    return (
        <Box>
            <Stack spacing={2} sx={{ mb: 2.5 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
                        Cấu hình hệ thống
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 640 }}>
                        Chỉ chỉnh các khóa hệ thống đã được backend hỗ trợ; không thêm khóa tùy ý.
                    </Typography>
                </Box>

                {!loadError ? (
                    <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'stretch', lg: 'center' }}
                        flexWrap="wrap"
                        useFlexGap
                    >
                        <TextField
                            size="small"
                            placeholder="Tìm theo tên hiển thị hoặc mô tả"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={isLoading}
                            sx={searchFieldSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <FormControl size="small" sx={selectFieldSx}>
                            <InputLabel id="admin-config-sort-updated">Sắp xếp</InputLabel>
                            <Select
                                labelId="admin-config-sort-updated"
                                label="Sắp xếp"
                                value={sortUpdatedDir}
                                disabled={isLoading}
                                onChange={(e) => setSortUpdatedDir(e.target.value)}
                            >
                                <MenuItem value="default">Tất cả</MenuItem>
                                <MenuItem value="desc">Cập nhật: mới nhất trước</MenuItem>
                                <MenuItem value="asc">Cập nhật: cũ nhất trước</MenuItem>
                            </Select>
                        </FormControl>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{
                                ml: { lg: 'auto' },
                                justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={loadConfigs}
                                disabled={isLoading}
                                sx={{
                                    borderRadius: 999,
                                    textTransform: 'none',
                                    color: '#e9d5ff',
                                    borderColor: 'rgba(233,213,255,0.35)',
                                }}
                            >
                                Tải lại
                            </Button>
                            <SettingsSuggestIcon sx={{ color: 'rgba(255,255,255,0.45)' }} fontSize="small" />
                        </Stack>
                    </Stack>
                ) : null}
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
                <>
                    <TableContainer sx={tableContainerSx}>
                        <Table stickyHeader size="medium" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={72}>ID</TableCell>
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
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.55)' }}>
                                            Chưa có bản ghi cấu hình hỗ trợ trên server.
                                        </TableCell>
                                    </TableRow>
                                ) : sortedFilteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.55)' }}>
                                            <Stack spacing={1} alignItems="center">
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                                                    Không có dòng nào khớp tìm kiếm.
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => setSearchQuery('')}
                                                    sx={{
                                                        textTransform: 'none',
                                                        color: '#e9d5ff',
                                                        borderColor: 'rgba(233,213,255,0.35)',
                                                    }}
                                                >
                                                    Xóa bộ lọc
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                                {pagedRows.map((row) => (
                                    <TableRow key={row.id != null ? `cfg-${row.id}` : row.config_id}>
                                        <TableCell
                                            sx={{
                                                color: 'rgba(255,255,255,0.55)',
                                                fontVariantNumeric: 'tabular-nums',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {row.id != null ? row.id : '—'}
                                        </TableCell>
                                        <TableCell sx={{ color: 'rgba(255,255,255,0.92)' }}>
                                            {CONFIG_LABELS[row.config_name] ?? row.config_name}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            {row.config_value}
                                        </TableCell>
                                        <TableCell sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 320 }}>
                                            {row.description ? (
                                                <Tooltip title={row.description} arrow placement="top-start">
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: 'rgba(255,255,255,0.75)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: 320,
                                                        }}
                                                    >
                                                        {row.description}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
                                            {formatDateTime(row.updated_at)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={isSupportedKey(row) ? 'Chỉnh sửa giá trị' : 'Khóa này chưa được backend hỗ trợ thao tác'}>
                                                <IconButton
                                                    size="small"
                                                    disabled={!isSupportedKey(row)}
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
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            mt: 2,
                            py: 1,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                            {totalCount === 0
                                ? '0 kết quả'
                                : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} / ${totalCount}`}
                        </Typography>
                        <Pagination
                            count={totalPages}
                            page={page + 1}
                            onChange={(_, value) => setPage(value - 1)}
                            disabled={isLoading || totalCount === 0}
                            color="primary"
                            size="small"
                            sx={{
                                '& .MuiPaginationItem-root': { color: 'rgba(255,255,255,0.88)' },
                            }}
                        />
                    </Box>
                </>
            )}

            <Dialog
                open={editOpen}
                onClose={handleDialogClose}
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
                                    const raw = e.target.value;
                                    const nextValue = isIntegerValidation(editing.validation)
                                        ? sanitizeUnsignedIntegerInput(raw)
                                        : raw;
                                    setDraftValue(nextValue);
                                    if (fieldError) setFieldError('');
                                }}
                                error={Boolean(fieldError)}
                                helperText={
                                    fieldError ? (
                                        fieldError
                                    ) : valueHelperText ? (
                                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                            <InfoOutlinedIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }} />
                                            <span>{valueHelperText}</span>
                                        </Box>
                                    ) : undefined
                                }
                                FormHelperTextProps={{ id: 'config-value-helper' }}
                                fullWidth
                                autoFocus
                                disabled={isSaving}
                                inputProps={
                                    isIntegerValidation(editing.validation)
                                        ? {
                                            inputMode: 'numeric',
                                            onKeyDown: (e) => {
                                                if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                                                    e.preventDefault();
                                                }
                                            },
                                            'aria-describedby': 'config-value-helper',
                                        }
                                        : { 'aria-describedby': 'config-value-helper' }
                                }
                                sx={{
                                    ...DARK_DIALOG_TEXTFIELD_SX,
                                    '& .MuiFormHelperText-root': {
                                        color: fieldError ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                                    },
                                }}
                            />
                            <TextField
                                label="Mô tả"
                                value={draftDescription}
                                onChange={(e) => {
                                    setDraftDescription(e.target.value);
                                    if (descriptionError) setDescriptionError('');
                                }}
                                error={Boolean(descriptionError)}
                                fullWidth
                                multiline
                                minRows={2}
                                disabled={isSaving}
                                inputProps={{
                                    maxLength: DESCRIPTION_MAX_LENGTH,
                                    'aria-describedby': 'config-description-helper',
                                }}
                                FormHelperTextProps={{ id: 'config-description-helper' }}
                                helperText={
                                    descriptionError ? (
                                        descriptionError
                                    ) : (
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'block',
                                                color: 'rgba(255,255,255,0.55)',
                                                fontSize: 12,
                                            }}
                                        >
                                            {draftDescription.length}/{DESCRIPTION_MAX_LENGTH} ký tự
                                        </Box>
                                    )
                                }
                                sx={{
                                    ...DARK_DIALOG_TEXTFIELD_SX,
                                    '& .MuiFormHelperText-root': {
                                        color: descriptionError ? '#fca5a5' : 'rgba(255,255,255,0.45)',
                                    },
                                }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleDialogClose} disabled={isSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Hủy
                    </Button>
                    <Tooltip title={saveDisabledReason} disableHoverListener={!saveDisabledReason}>
                        <span>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={isSaving || !hasDraftChanges}
                                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                            >
                                {isSaving ? 'Đang lưu…' : 'Lưu'}
                            </Button>
                        </span>
                    </Tooltip>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={discardConfirmOpen}
                title="Bỏ thay đổi chưa lưu"
                content="Bạn đang có thay đổi chưa lưu. Nếu tiếp tục, các chỉnh sửa hiện tại sẽ bị hủy."
                variant="warning"
                confirmLabel="Bỏ thay đổi"
                cancelLabel="Tiếp tục chỉnh sửa"
                onClose={handleCancelDiscardChanges}
                onConfirm={handleConfirmDiscardChanges}
                loading={isSaving}
            />

        </Box>
    );
}
