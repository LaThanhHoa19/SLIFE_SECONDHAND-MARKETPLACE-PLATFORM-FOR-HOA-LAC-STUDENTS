/** Mục đích: Quản lý danh mục (admin). API: GET/POST/PUT/DELETE /api/admin/categories. */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';

import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from '../../api/categoryAdminApi';
import { DARK_DIALOG_PAPER_PROPS } from '../../components/common/dialogStyles';
import { ADMIN_THEME as palette } from '../../theme/adminTheme';

const ROOT_PARENT_ID = null;

/** Khớp CreateCategoryRequest (backend) */
const CATEGORY_NAME_MAX = 200;
const CATEGORY_DESC_MAX = 2000;

function formatApiError(e, fallback) {
    const msg = e?.response?.data?.message ?? e?.message ?? e?.raw?.response?.data?.message ?? e?.raw?.message;
    return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

const fieldDarkSx = {
    '& .MuiInputBase-input': { color: '#fff', outline: 'none' },
    /* Multiline = native <textarea> — trình duyệt vẽ outline xanh riêng, không dùng rule input */
    '& textarea.MuiInputBase-input': {
        color: '#fff',
        outline: 'none',
        boxShadow: 'none',
    },
    '& .MuiOutlinedInput-root textarea': {
        outline: 'none',
        boxShadow: 'none',
    },
    '& textarea:focus': { outline: 'none', boxShadow: 'none' },
    '& textarea:focus-visible': { outline: 'none', boxShadow: 'none' },
    '& .MuiInputLabel-root': { color: palette.textMuted },
    '& .MuiOutlinedInput-root': {
        outline: 'none',
        boxShadow: 'none',
        bgcolor: 'rgba(0,0,0,0.25)',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
        '&:hover fieldset': { borderColor: 'rgba(167,139,250,0.4)' },
        '&.Mui-focused': { outline: 'none', boxShadow: 'none' },
        '&.Mui-focused fieldset': { borderColor: palette.purpleStrong, borderWidth: 1 },
    },
    '& input:focus': { outline: 'none', boxShadow: 'none' },
    '& input:focus-visible': { outline: 'none', boxShadow: 'none' },
    '& .MuiFormHelperText-root': { color: palette.textMuted, marginTop: 0.75 },
    '& .MuiFormHelperText-root.Mui-error': { color: '#f87171' },
    '& .MuiOutlinedInput-root.Mui-error': {
        outline: 'none',
        boxShadow: 'none',
        '& fieldset': { borderColor: 'rgba(248,113,113,0.85)' },
        '&:hover fieldset': { borderColor: 'rgba(248,113,113,0.95)' },
        '&.Mui-focused fieldset': { borderColor: '#f87171', borderWidth: 2 },
    },
};

function validateCategoryFields(nameRaw, descriptionRaw) {
    const name = (nameRaw || '').trim();
    const desc = (descriptionRaw || '').trim();
    const errors = { name: '', description: '' };
    if (!name) errors.name = 'Tên danh mục bắt buộc.';
    else if (name.length > CATEGORY_NAME_MAX) errors.name = `Tên tối đa ${CATEGORY_NAME_MAX} ký tự.`;
    if (!desc) errors.description = 'Mô tả bắt buộc.';
    else if (desc.length > CATEGORY_DESC_MAX) errors.description = `Mô tả tối đa ${CATEGORY_DESC_MAX} ký tự.`;
    const valid = !errors.name && !errors.description;
    return { valid, errors };
}

function normalizeId(v) {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function buildCategoryTree(flatList) {
    if (!Array.isArray(flatList) || flatList.length === 0) return [];

    const byId = new Map();
    flatList.forEach((c) => {
        const id = normalizeId(c.id ?? c.categoryId);
        if (id == null) return;
        byId.set(id, { ...c, id, children: [] });
    });

    const roots = [];
    flatList.forEach((c) => {
        const id = normalizeId(c.id ?? c.categoryId);
        if (id == null) return;
        const node = byId.get(id);
        if (!node) return;

        const parentId = c.parentId !== undefined ? normalizeId(c.parentId) : normalizeId(c.parent_id);
        if (parentId == null) {
            roots.push(node);
            return;
        }

        const parent = byId.get(parentId);
        if (parent) parent.children.push(node);
        else roots.push(node);
    });

    return roots;
}

function filterCategoryTree(nodes, q) {
    const t = (q || '').trim().toLowerCase();
    if (!t) return nodes;

    const walk = (node) => {
        const nameMatch = (node.name || '').toLowerCase().includes(t);
        const descMatch = (node.description || '').toLowerCase().includes(t);
        const kids = (node.children || []).map(walk).filter(Boolean);
        if (nameMatch || descMatch || kids.length) {
            return { ...node, children: kids };
        }
        return null;
    };

    return nodes.map(walk).filter(Boolean);
}

function findFirstExpandableNode(tree) {
    const stack = [...tree];
    while (stack.length) {
        const node = stack.shift();
        if (Array.isArray(node.children) && node.children.length > 0) return node;
        if (Array.isArray(node.children)) stack.push(...node.children);
    }
    return null;
}

function collectDescendants(tree, rootId) {
    const out = new Set();
    const walk = (nodes) => {
        for (const n of nodes || []) {
            if (n.id === rootId) {
                collectSub(n);
            } else {
                walk(n.children);
            }
        }
    };

    const collectSub = (node) => {
        for (const ch of node.children || []) {
            if (ch?.id != null) out.add(ch.id);
            collectSub(ch);
        }
    };

    walk(tree);
    return out;
}

function countDescendants(node) {
    if (!node?.children?.length) return 0;
    let n = node.children.length;
    for (const ch of node.children) {
        n += countDescendants(ch);
    }
    return n;
}

/** Key ổn định cho React — ưu tiên id số hợp lệ */
function categoryStableKey(node, index) {
    const id = node?.id ?? node?.categoryId;
    if (id != null && Number.isFinite(Number(id))) return `c-${id}`;
    return `c-i${index}-${String(node?.name ?? '').slice(0, 24)}`;
}

function StatCard({ label, value, hint, dotColor }) {
    return (
        <Box
            sx={{
                flex: 1,
                minWidth: { xs: '100%', sm: 200 },
                p: 2.25,
                borderRadius: 2.5,
                bgcolor: palette.bgCard,
                border: `1px solid ${palette.borderAccent}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: palette.textMuted,
                    fontSize: 10,
                }}
            >
                {label}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                {dotColor ? (
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: dotColor,
                            boxShadow: `0 0 10px ${dotColor}`,
                        }}
                    />
                ) : null}
                <Typography
                    variant="h6"
                    sx={{
                        color: palette.text,
                        fontWeight: 800,
                        fontSize: 18,
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'normal',
                    }}
                >
                    {value}
                </Typography>
            </Stack>
            {hint ? (
                <Typography variant="caption" sx={{ color: palette.textMuted, display: 'block', mt: 0.75 }}>
                    {hint}
                </Typography>
            ) : null}
        </Box>
    );
}

function CategoryTreeNode({
                              node,
                              depth,
                              expandedParents,
                              onToggleExpand,
                              onAddChild,
                              onEdit,
                              onDelete,
                          }) {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expandedParents.has(node.id);
    const Icon = depth === 0 ? MenuBookOutlinedIcon : FolderOutlinedIcon;

    const actionBtnSx = {
        color: palette.textMuted,
        '&:hover': { color: palette.purple, bgcolor: 'rgba(139,92,246,0.12)' },
    };

    const row = (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: depth === 0 ? 0.5 : 0.85,
                pr: 0.5,
            }}
        >
            {hasChildren ? (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(node.id);
                    }}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Thu gọn danh mục con' : 'Mở rộng danh mục con'}
                    sx={{
                        width: 34,
                        height: 34,
                        color: palette.purple,
                        '&:hover': { bgcolor: 'rgba(139,92,246,0.12)' },
                    }}
                >
                    {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 22 }} /> : <ChevronRightIcon sx={{ fontSize: 22 }} />}
                </IconButton>
            ) : (
                <Box sx={{ width: 34, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    {depth > 0 ? (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: palette.purpleStrong, opacity: 0.7 }} />
                    ) : null}
                </Box>
            )}

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: depth === 0 ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                    color: depth === 0 ? palette.purple : palette.textMuted,
                    flexShrink: 0,
                }}
            >
                <Icon sx={{ fontSize: 22 }} />
            </Box>

            <Typography
                sx={{
                    flex: 1,
                    minWidth: 0,
                    fontWeight: depth === 0 ? 800 : 600,
                    fontSize: depth === 0 ? 15 : 14,
                    color: palette.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {node.name}
            </Typography>

            {depth === 0 ? (
                <Chip
                    label="Gốc"
                    size="small"
                    sx={{
                        height: 24,
                        fontWeight: 800,
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        bgcolor: 'rgba(139,92,246,0.25)',
                        color: '#e9d5ff',
                        border: '1px solid rgba(167,139,250,0.45)',
                    }}
                />
            ) : null}

            <Stack direction="row" spacing={0.25}>
                <IconButton size="small" onClick={() => onAddChild(node.id)} title="Thêm con" aria-label="Thêm danh mục con" sx={actionBtnSx}>
                    <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" onClick={() => onEdit(node)} title="Sửa" aria-label="Sửa danh mục" sx={actionBtnSx}>
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(node.id)} title="Xóa" aria-label="Xóa danh mục" sx={actionBtnSx}>
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Stack>
        </Box>
    );

    if (depth === 0) {
        return (
            <Box
                sx={{
                    borderRadius: 2.5,
                    p: 2,
                    mb: 2,
                    bgcolor: palette.bgCard,
                    border: `1px solid ${palette.borderAccent}`,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                }}
            >
                {row}
                {hasChildren && isExpanded ? (
                    <Box
                        sx={{
                            mt: 1.5,
                            ml: 1,
                            pl: 2,
                            borderLeft: '2px solid rgba(139,92,246,0.35)',
                        }}
                    >
                        {node.children.map((ch, idx) => (
                            <CategoryTreeNode
                                key={categoryStableKey(ch, idx)}
                                node={ch}
                                depth={depth + 1}
                                expandedParents={expandedParents}
                                onToggleExpand={onToggleExpand}
                                onAddChild={onAddChild}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </Box>
                ) : null}
            </Box>
        );
    }

    return (
        <Box>
            {row}
            {hasChildren && isExpanded ? (
                <Box sx={{ pl: 3, ml: 1.5, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                    {node.children.map((ch, idx) => (
                        <CategoryTreeNode
                            key={categoryStableKey(ch, idx)}
                            node={ch}
                            depth={depth + 1}
                            expandedParents={expandedParents}
                            onToggleExpand={onToggleExpand}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </Box>
            ) : null}
        </Box>
    );
}

const parentSelectMenuProps = {
    PaperProps: {
        sx: {
            bgcolor: palette.bgCard,
            border: `1px solid ${palette.borderAccent}`,
            borderRadius: 2,
            mt: 0.5,
            maxHeight: 280,
            '& .MuiMenuItem-root': {
                color: palette.text,
                fontSize: 14,
            },
            '& .MuiMenuItem-root.Mui-selected': {
                bgcolor: 'rgba(139,92,246,0.2)',
            },
            '& .MuiMenuItem-root.Mui-selected:hover': {
                bgcolor: 'rgba(139,92,246,0.28)',
            },
            '& .MuiMenuItem-root:hover': {
                bgcolor: 'rgba(255,255,255,0.06)',
            },
            '& .MuiMenuItem-root.Mui-disabled': {
                opacity: 0.4,
            },
        },
    },
};

export default function CategoryManagementPage() {
    const [flatCategories, setFlatCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [expandedParents, setExpandedParents] = useState(new Set());

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('createRoot');

    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formParentId, setFormParentId] = useState(ROOT_PARENT_ID);
    const [formErrors, setFormErrors] = useState({ name: '', description: '' });

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleteTargetName, setDeleteTargetName] = useState('');
    const [editingId, setEditingId] = useState(null);

    /** Chỉ auto-mở node đầu tiên một lần sau lần tải đầu — tránh reset cả cây sau mỗi lần reload CRUD */
    const didInitialExpand = useRef(false);

    /** true nếu payload không hề có field parent (camel hoặc snake) — khác với “toàn null” (vẫn có cây phẳng hợp lệ) */
    const apiMissingParentIdField = useMemo(() => {
        if (!flatCategories.length) return false;
        return flatCategories.every(
            (c) => !Object.prototype.hasOwnProperty.call(c, 'parentId') && !Object.prototype.hasOwnProperty.call(c, 'parent_id'),
        );
    }, [flatCategories]);

    const categoryTree = useMemo(() => buildCategoryTree(flatCategories), [flatCategories]);
    const filteredTree = useMemo(() => filterCategoryTree(categoryTree, searchQuery), [categoryTree, searchQuery]);

    const hottestCategory = useMemo(() => {
        if (!categoryTree.length) return null;
        let best = categoryTree[0];
        let bestN = countDescendants(best);
        for (const n of categoryTree) {
            const c = countDescendants(n);
            if (c > bestN) {
                best = n;
                bestN = c;
            }
        }
        return best;
    }, [categoryTree]);

    const reload = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getAdminCategories();
            const raw = res?.data?.data ?? res?.data;
            const arr = Array.isArray(raw) ? raw : [];
            setFlatCategories(arr);
        } catch (e) {
            setError(formatApiError(e, 'Không tải được danh mục.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (loading || categoryTree.length === 0 || didInitialExpand.current) return;
        const first = findFirstExpandableNode(categoryTree);
        if (first?.id != null) {
            setExpandedParents(new Set([first.id]));
            didInitialExpand.current = true;
        }
    }, [loading, categoryTree]);

    useEffect(() => {
        if (searchQuery.trim()) {
            setExpandedParents((prev) => {
                const next = new Set(prev);
                const expandAll = (nodes) => {
                    for (const n of nodes || []) {
                        if (n.children?.length) {
                            next.add(n.id);
                            expandAll(n.children);
                        }
                    }
                };
                expandAll(filteredTree);
                return next;
            });
        }
    }, [searchQuery, filteredTree]);

    const toggleCategoryExpand = (id) => {
        setExpandedParents((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openCreateRoot = () => {
        setError('');
        setFormErrors({ name: '', description: '' });
        setDialogMode('createRoot');
        setFormName('');
        setFormDescription('');
        setFormParentId(ROOT_PARENT_ID);
        setDialogOpen(true);
    };

    const openCreateChild = (parentId) => {
        setError('');
        setFormErrors({ name: '', description: '' });
        setDialogMode('createChild');
        setFormName('');
        setFormDescription('');
        setFormParentId(parentId ?? null);
        setDialogOpen(true);
    };

    const openEdit = (node) => {
        setError('');
        setFormErrors({ name: '', description: '' });
        setDialogMode('edit');
        setFormName(node.name || '');
        setFormDescription(node.description || '');
        setFormParentId(node.parentId ?? null);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
        setFormErrors({ name: '', description: '' });
    };

    const openEditWithId = (node) => {
        setEditingId(node.id ?? null);
        openEdit(node);
    };

    const openDelete = (id) => {
        setDeleteTargetId(id);
        const row = flatCategories.find((c) => Number(c.id) === Number(id));
        setDeleteTargetName(row?.name?.trim() || '');
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTargetId == null) return;
        try {
            await deleteAdminCategory(deleteTargetId);
            setDeleteConfirmOpen(false);
            setDeleteTargetId(null);
            setDeleteTargetName('');
            await reload();
        } catch (e) {
            setError(formatApiError(e, 'Xóa thất bại.'));
        }
    };

    const handleSubmitDialog = async () => {
        const { valid, errors } = validateCategoryFields(formName, formDescription);
        setFormErrors(errors);
        if (!valid) {
            setError('');
            return;
        }

        const payload = {
            name: formName.trim(),
            description: formDescription.trim(),
            parentId: formParentId ?? null,
        };

        try {
            if (dialogMode === 'edit') {
                if (editingId == null) throw new Error('Missing editingId');
                await updateAdminCategory(editingId, payload);
            } else {
                await createAdminCategory(payload);
            }
            closeDialog();
            await reload();
        } catch (e) {
            setError(formatApiError(e, 'Có lỗi khi lưu danh mục.'));
        }
    };

    const flattenedOptions = useMemo(
        () =>
            flatCategories
                .filter((c) => c.id != null && Number.isFinite(Number(c.id)))
                .map((c) => ({ id: c.id, name: c.name })),
        [flatCategories],
    );
    const descendantsOfEditing = useMemo(() => collectDescendants(categoryTree, editingId), [categoryTree, editingId]);

    const alertSx = {
        mb: 2,
        bgcolor: 'rgba(139,92,246,0.08)',
        color: palette.text,
        border: '1px solid rgba(167,139,250,0.25)',
        '& .MuiAlert-icon': { color: palette.purple },
    };

    return (
        <Box sx={{ bgcolor: 'transparent', py: 0, px: 0 }}>
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Box>
                        <Typography variant="h4" sx={{ color: palette.text, fontWeight: 800, fontSize: { xs: 24, md: 28 }, letterSpacing: -0.5 }}>
                            Quản lý danh mục
                        </Typography>
                        <Typography variant="body2" sx={{ color: palette.textMuted, mt: 0.75, maxWidth: 520 }}>
                            Xây dựng và tổ chức cấu trúc phân cấp cho sản phẩm và tài liệu.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={openCreateRoot}
                        startIcon={<AddIcon />}
                        sx={{
                            alignSelf: { xs: 'stretch', sm: 'center' },
                            textTransform: 'none',
                            fontWeight: 800,
                            borderRadius: 999,
                            px: 3,
                            py: 1.1,
                            bgcolor: palette.purpleStrong,
                            boxShadow: palette.purpleGlow,
                            '&:hover': {
                                bgcolor: '#7c3aed',
                                boxShadow: '0 0 28px rgba(139, 92, 246, 0.45)',
                            },
                        }}
                    >
                        Thêm danh mục gốc
                    </Button>
                </Stack>

                <TextField
                    fullWidth
                    name="categorySearch"
                    id="admin-category-search"
                    autoComplete="off"
                    placeholder="Tìm kiếm theo tên hoặc mô tả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    inputProps={{ 'aria-label': 'Lọc danh mục theo tên hoặc mô tả' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: palette.textMuted, fontSize: 22 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        maxWidth: 560,
                        '& .MuiFormControl-root': { outline: 'none' },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 999,
                            outline: 'none',
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            pl: 1,
                            boxShadow: 'none',
                            '& fieldset': { border: 'none' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            '&.Mui-focused': {
                                outline: 'none',
                                boxShadow: 'none',
                                bgcolor: 'rgba(139,92,246,0.08)',
                                borderColor: 'rgba(167,139,250,0.45)',
                            },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        },
                        '& .MuiInputBase-input': {
                            outline: 'none',
                            borderRadius: 999,
                        },
                        '& input:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none',
                        },
                        '& input::placeholder': { color: palette.textMuted, opacity: 1 },
                    }}
                />

                {apiMissingParentIdField ? (
                    <Alert severity="warning" sx={{ ...alertSx, bgcolor: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.3)', '& .MuiAlert-icon': { color: '#eab308' } }}>
                        Phản hồi API không có trường danh mục cha (parentId). Cây phân cấp có thể không chính xác — kiểm tra DTO/backend.
                    </Alert>
                ) : null}

                {loading ? (
                    <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress sx={{ color: palette.purple }} />
                    </Box>
                ) : (
                    <>
                        {error ? (
                            <Alert severity="error" sx={{ ...alertSx, bgcolor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.35)', '& .MuiAlert-icon': { color: '#f87171' } }}>
                                {error}
                            </Alert>
                        ) : null}

                        {filteredTree.length === 0 ? (
                            <Stack spacing={2} alignItems="stretch">
                                <Typography variant="body2" sx={{ color: palette.textMuted }}>
                                    {searchQuery.trim() ? 'Không có danh mục khớp tìm kiếm.' : 'Chưa có danh mục nào.'}
                                </Typography>
                                <Box
                                    component="button"
                                    type="button"
                                    onClick={openCreateRoot}
                                    sx={{
                                        border: '2px dashed rgba(139,92,246,0.35)',
                                        borderRadius: 2.5,
                                        py: 4,
                                        px: 2,
                                        bgcolor: 'rgba(139,92,246,0.04)',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: palette.textMuted,
                                        transition: '0.2s',
                                        '&:hover': {
                                            borderColor: 'rgba(167,139,250,0.55)',
                                            bgcolor: 'rgba(139,92,246,0.08)',
                                            color: palette.purple,
                                        },
                                    }}
                                >
                                    <CreateNewFolderOutlinedIcon sx={{ fontSize: 40, opacity: 0.85 }} />
                                    <Typography sx={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: 12 }}>
                                        THÊM DANH MỤC MỚI
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Box>
                                {filteredTree.map((node, rootIdx) => (
                                    <CategoryTreeNode
                                        key={categoryStableKey(node, rootIdx)}
                                        node={node}
                                        depth={0}
                                        expandedParents={expandedParents}
                                        onToggleExpand={toggleCategoryExpand}
                                        onAddChild={openCreateChild}
                                        onEdit={openEditWithId}
                                        onDelete={openDelete}
                                    />
                                ))}
                                <Box
                                    component="button"
                                    type="button"
                                    onClick={openCreateRoot}
                                    sx={{
                                        border: '2px dashed rgba(139,92,246,0.28)',
                                        borderRadius: 2.5,
                                        py: 3,
                                        px: 2,
                                        bgcolor: 'transparent',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1.5,
                                        color: palette.textMuted,
                                        width: '100%',
                                        mt: 1,
                                        '&:hover': {
                                            borderColor: 'rgba(167,139,250,0.5)',
                                            color: palette.purple,
                                            bgcolor: 'rgba(139,92,246,0.06)',
                                        },
                                    }}
                                >
                                    <CreateNewFolderOutlinedIcon sx={{ fontSize: 28 }} />
                                    <Typography sx={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: 11 }}>
                                        THÊM DANH MỤC MỚI
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ pt: 2 }}>
                            <StatCard
                                label="TỔNG DANH MỤC"
                                value={flatCategories.length}
                                hint="Tổng số trong hệ thống"
                            />
                            <StatCard
                                label="DANH MỤC NỔI BẬT"
                                value={hottestCategory?.name || '—'}
                                hint={hottestCategory ? 'Nhiều danh mục con nhất trong nhóm gốc' : 'Chưa có dữ liệu'}
                            />
                            <StatCard
                                label="TRẠNG THÁI HỆ THỐNG"
                                value={error ? 'Cần kiểm tra' : 'Hoạt động ổn định'}
                                hint={error ? 'Xem thông báo lỗi phía trên' : 'API danh mục'}
                                dotColor={error ? '#f87171' : '#34d399'}
                            />
                        </Stack>
                    </>
                )}
            </Stack>

            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="sm"
                fullWidth
                scroll="paper"
                PaperProps={DARK_DIALOG_PAPER_PROPS}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {dialogMode === 'edit' ? 'Sửa danh mục' : dialogMode === 'createChild' ? 'Thêm danh mục con' : 'Thêm danh mục gốc'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {dialogMode === 'createChild' ? (
                            <Alert severity="info" sx={alertSx}>
                                Danh mục mới sẽ là cấp con của danh mục bạn vừa chọn trên cây.
                            </Alert>
                        ) : null}

                        <TextField
                            label="Tên danh mục"
                            value={formName}
                            required
                            error={!!formErrors.name}
                            helperText={formErrors.name || `${formName.length}/${CATEGORY_NAME_MAX}`}
                            onChange={(e) => {
                                const v = e.target.value.slice(0, CATEGORY_NAME_MAX);
                                setFormName(v);
                                setFormErrors((prev) => ({ ...prev, name: '' }));
                                setError('');
                            }}
                            fullWidth
                            inputProps={{ maxLength: CATEGORY_NAME_MAX }}
                            sx={fieldDarkSx}
                        />
                        <TextField
                            label="Mô tả"
                            value={formDescription}
                            required
                            error={!!formErrors.description}
                            helperText={formErrors.description || `${formDescription.length}/${CATEGORY_DESC_MAX}`}
                            onChange={(e) => {
                                const v = e.target.value.slice(0, CATEGORY_DESC_MAX);
                                setFormDescription(v);
                                setFormErrors((prev) => ({ ...prev, description: '' }));
                                setError('');
                            }}
                            fullWidth
                            multiline
                            minRows={3}
                            sx={[fieldDarkSx, { '& textarea': { outline: 'none !important', boxShadow: 'none !important' } }]}
                            inputProps={{
                                maxLength: CATEGORY_DESC_MAX,
                                style: { outline: 'none', boxShadow: 'none' },
                            }}
                        />

                        {dialogMode === 'edit' ? (
                            <>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: palette.textMuted }}>
                                    Danh mục cha
                                </Typography>
                                <Select
                                    value={formParentId ?? ''}
                                    onChange={(e) => setFormParentId(e.target.value === '' ? null : Number(e.target.value))}
                                    fullWidth
                                    displayEmpty
                                    MenuProps={parentSelectMenuProps}
                                    sx={{
                                        color: '#fff',
                                        bgcolor: 'rgba(0,0,0,0.25)',
                                        outline: 'none',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(167,139,250,0.4)' },
                                        '&.Mui-focused': { outline: 'none', boxShadow: 'none' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(167,139,250,0.55)',
                                            borderWidth: 1,
                                        },
                                        '& .MuiSvgIcon-root': { color: palette.textMuted },
                                    }}
                                >
                                    <MenuItem value="">(Danh mục gốc)</MenuItem>
                                    {flattenedOptions.map((opt, optIdx) => {
                                        const disabled = opt.id === editingId || descendantsOfEditing.has(opt.id);
                                        return (
                                            <MenuItem key={opt.id != null ? `p-${opt.id}` : `p-i-${optIdx}`} value={opt.id} disabled={disabled}>
                                                {opt.name}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDialog} disabled={loading} sx={{ color: palette.textMuted }}>
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitDialog}
                        disabled={loading}
                        sx={{
                            bgcolor: palette.purpleStrong,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: palette.purpleGlow,
                            '&:hover': { bgcolor: '#7c3aed' },
                        }}
                    >
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setDeleteTargetId(null);
                    setDeleteTargetName('');
                }}
                maxWidth="xs"
                fullWidth
                PaperProps={DARK_DIALOG_PAPER_PROPS}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: palette.textMuted }}>
                        {deleteTargetName ? (
                            <>
                                Xóa danh mục{' '}
                                <Typography component="span" sx={{ color: palette.text, fontWeight: 700 }}>
                                    “{deleteTargetName}”
                                </Typography>
                                ? Danh mục con (nếu có) sẽ thành mục gốc (không còn cha).
                            </>
                        ) : (
                            'Xóa danh mục này? Danh mục con (nếu có) sẽ thành mục gốc (không còn cha).'
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setDeleteConfirmOpen(false);
                            setDeleteTargetId(null);
                            setDeleteTargetName('');
                        }}
                        disabled={loading}
                        sx={{ color: palette.textMuted }}
                    >
                        Hủy
                    </Button>
                    <Button variant="contained" color="error" onClick={confirmDelete} disabled={loading} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
