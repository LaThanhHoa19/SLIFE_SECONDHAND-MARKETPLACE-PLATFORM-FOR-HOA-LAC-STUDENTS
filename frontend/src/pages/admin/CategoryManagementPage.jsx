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
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import WarningIcon from '@mui/icons-material/Warning';

import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from '../../api/categoryAdminApi';
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

/** Modal tạo/sửa danh mục — khớp mock Stitch (bo góc lớn, subtitle EN, info box, CTA pill). */
const categoryModalPaperSx = {
    width: '100%',
    maxWidth: { xs: 'min(100%, calc(100vw - 24px))', sm: 640, md: 720 },
    bgcolor: '#1a1822',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 24px 56px rgba(0,0,0,0.5), 0 0 100px rgba(139, 92, 246, 0.07)',
    overflow: 'hidden',
};

/** Modal xác nhận xóa danh mục — khớp mock Stitch (icon cảnh báo, căn giữa, CTA đỏ gradient). */
const deleteCategoryModalPaperSx = {
    width: '100%',
    maxWidth: { xs: 'min(100%, calc(100vw - 24px))', sm: 440 },
    bgcolor: '#1a1d26',
    borderRadius: '22px',
    border: '1px solid rgba(99, 102, 241, 0.14)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.55), 0 0 60px rgba(239, 68, 68, 0.06)',
    overflow: 'visible',
};

const categoryModalLabelSx = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'rgba(148, 163, 184, 0.95)',
    mb: 0.875,
};

const categoryModalFieldSx = [
    fieldDarkSx,
    {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(0,0,0,0.4)',
            borderRadius: 2,
            '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
            '&:hover fieldset': { borderColor: 'rgba(167,139,250,0.35)' },
            '&.Mui-focused fieldset': { borderColor: palette.purpleStrong, borderWidth: 1 },
        },
    },
];

const categoryModalCounterSx = {
    fontSize: 11,
    color: 'rgba(255,255,255,0.32)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
};

function getCategoryDialogCopy(mode) {
    if (mode === 'edit') {
        return {
            title: 'Sửa danh mục',
            subtitleEn: 'Update the name, description, or parent for this category.',
            infoVi:
                'Thay đổi danh mục cha sẽ di chuyển cả nhánh con (nếu có). Hãy kiểm tra kỹ trước khi lưu.',
        };
    }
    if (mode === 'createChild') {
        return {
            title: 'Thêm danh mục con',
            subtitleEn: 'Add a new subcategory under the parent you selected in the tree.',
            infoVi:
                'Danh mục mới sẽ nằm dưới danh mục cha bạn đã chọn. Sau này có thể chỉnh lại vị trí bằng mục Sửa.',
        };
    }
    return {
        title: 'Thêm danh mục gốc',
        subtitleEn: 'Create a new top-level classification for your digital assets.',
        infoVi:
            'Danh mục gốc sẽ xuất hiện tại bảng điều khiển chính và có thể chứa nhiều danh mục con khác nhau. Hãy đảm bảo tên gọi ngắn gọn và súc tích.',
    };
}

function validateCategoryFields(nameRaw, descriptionRaw, opts = {}) {
    const { flatCategories = [], excludeCategoryId = null } = opts;
    const name = (nameRaw || '').trim();
    const desc = (descriptionRaw || '').trim();
    const errors = { name: '', description: '' };
    const excludeN = normalizeId(excludeCategoryId);

    if (!name) errors.name = 'Tên danh mục bắt buộc.';
    else if (name.length > CATEGORY_NAME_MAX) errors.name = `Tên tối đa ${CATEGORY_NAME_MAX} ký tự.`;
    else {
        const key = name.toLowerCase();
        const dup = flatCategories.some((c) => {
            const id = normalizeId(c.id ?? c.categoryId);
            if (id == null) return false;
            if (excludeN != null && id === excludeN) return false;
            return (c.name || '').trim().toLowerCase() === key;
        });
        if (dup) errors.name = 'Tên danh mục đã tồn tại.';
    }
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

/** Đọc parent từ dòng phẳng API (camel hoặc snake). */
function getFlatCategoryParentId(c) {
    if (!c || typeof c !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(c, 'parentId')) return normalizeId(c.parentId);
    if (Object.prototype.hasOwnProperty.call(c, 'parent_id')) return normalizeId(c.parent_id);
    return null;
}

function isRootFlatCategory(c) {
    return getFlatCategoryParentId(c) == null;
}

/** API: systemLocked (camelCase) — hỗ trợ cả snake_case nếu có */
function isSystemCategory(row) {
    return Boolean(row?.systemLocked ?? row?.system_locked);
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
    const locked = isSystemCategory(node);
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

            {locked ? (
                <Chip
                    label="Hệ thống"
                    size="small"
                    title="Danh mục cố định — không sửa/xóa"
                    sx={{
                        height: 24,
                        fontWeight: 800,
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        bgcolor: 'rgba(34,197,94,0.2)',
                        color: '#bbf7d0',
                        border: '1px solid rgba(74,222,128,0.45)',
                        flexShrink: 0,
                    }}
                />
            ) : null}

            <Stack direction="row" spacing={0.25}>
                <IconButton size="small" onClick={() => onAddChild(node.id)} title="Thêm con" aria-label="Thêm danh mục con" sx={actionBtnSx}>
                    <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                    size="small"
                    disabled={locked}
                    onClick={() => onEdit(node)}
                    title={locked ? 'Danh mục hệ thống — không được sửa' : 'Sửa'}
                    aria-label="Sửa danh mục"
                    sx={actionBtnSx}
                >
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                    size="small"
                    disabled={locked}
                    onClick={() => onDelete(node.id)}
                    title={locked ? 'Danh mục hệ thống — không được xóa' : 'Xóa'}
                    aria-label="Xóa danh mục"
                    sx={actionBtnSx}
                >
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

/** Scrollbar menu Select — tránh thanh trắng mặc định (Windows/Chrome). */
const selectMenuScrollbarSx = {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.22) rgba(0,0,0,0.2)',
    '&::-webkit-scrollbar': {
        width: 6,
    },
    '&::-webkit-scrollbar-track': {
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 6,
        margin: '4px 0',
    },
    '&::-webkit-scrollbar-thumb': {
        background: 'rgba(255,255,255,0.18)',
        borderRadius: 6,
        border: '2px solid transparent',
        backgroundClip: 'padding-box',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(255,255,255,0.28)',
        backgroundClip: 'padding-box',
    },
    '&::-webkit-scrollbar-button': {
        display: 'none',
        width: 0,
        height: 0,
    },
    '&::-webkit-scrollbar-corner': {
        background: 'transparent',
    },
};

const parentSelectMenuProps = {
    PaperProps: {
        sx: {
            bgcolor: palette.bgCard,
            border: `1px solid ${palette.borderAccent}`,
            borderRadius: 2,
            mt: 0.5,
            maxHeight: 280,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            '& .MuiList-root': {
                maxHeight: 268,
                overflowY: 'auto',
                overflowX: 'hidden',
                py: 0.5,
                ...selectMenuScrollbarSx,
            },
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
    MenuListProps: {
        sx: {
            maxHeight: 268,
            overflowY: 'auto',
            py: 0.5,
            ...selectMenuScrollbarSx,
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
        if (isSystemCategory(node)) return;
        setEditingId(node.id ?? null);
        openEdit(node);
    };

    const openDelete = (id) => {
        const row = flatCategories.find((c) => Number(c.id) === Number(id));
        if (isSystemCategory(row)) return;
        setDeleteTargetId(id);
        setDeleteTargetName(row?.name?.trim() || '');
        setDeleteConfirmOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteConfirmOpen(false);
        setDeleteTargetId(null);
        setDeleteTargetName('');
    };

    const confirmDelete = async () => {
        if (deleteTargetId == null) return;
        try {
            await deleteAdminCategory(deleteTargetId);
            closeDeleteDialog();
            await reload();
        } catch (e) {
            setError(formatApiError(e, 'Xóa thất bại.'));
        }
    };

    const handleSubmitDialog = async () => {
        const excludeCategoryId = dialogMode === 'edit' ? editingId : null;
        const { valid, errors } = validateCategoryFields(formName, formDescription, {
            flatCategories,
            excludeCategoryId,
        });
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

    /** Dropdown cha: chỉ danh mục gốc; nếu đang gắn cha là con (dữ liệu cũ) thì thêm 1 dòng để giá trị Select không mất. */
    const parentSelectOptions = useMemo(() => {
        const roots = flatCategories
            .filter((c) => normalizeId(c.id ?? c.categoryId) != null)
            .filter(isRootFlatCategory)
            .map((c) => ({ id: normalizeId(c.id ?? c.categoryId), name: c.name }));

        const cur = normalizeId(formParentId);
        if (cur == null) return roots;
        if (roots.some((o) => o.id === cur)) return roots;
        const row = flatCategories.find((c) => normalizeId(c.id ?? c.categoryId) === cur);
        if (!row) return roots;
        return [...roots, { id: cur, name: row.name }];
    }, [flatCategories, formParentId]);
    const descendantsOfEditing = useMemo(() => collectDescendants(categoryTree, editingId), [categoryTree, editingId]);
    const categoryDialogCopy = getCategoryDialogCopy(dialogMode);

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
                maxWidth={false}
                scroll="paper"
                aria-labelledby="category-dialog-title"
                PaperProps={{
                    sx: categoryModalPaperSx,
                }}
            >
                <DialogContent sx={{ p: 0, overflow: 'visible' }}>
                    <Box sx={{ px: { xs: 3, sm: 5 }, pt: 4, pb: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Box sx={{ pr: 1, minWidth: 0 }}>
                                <Typography
                                    component="h2"
                                    id="category-dialog-title"
                                    variant="h5"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { xs: '1.2rem', sm: '1.35rem' },
                                        letterSpacing: '-0.02em',
                                        color: palette.text,
                                        lineHeight: 1.25,
                                    }}
                                >
                                    {categoryDialogCopy.title}
                                </Typography>
                                <Typography sx={{ mt: 1.25, color: palette.textDim, fontSize: 14, lineHeight: 1.55, maxWidth: 'min(100%, 560px)' }}>
                                    {categoryDialogCopy.subtitleEn}
                                </Typography>
                            </Box>
                            <IconButton
                                aria-label="Đóng"
                                onClick={closeDialog}
                                disabled={loading}
                                size="small"
                                sx={{
                                    color: palette.textMuted,
                                    flexShrink: 0,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: palette.text },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        <Stack spacing={2.75} sx={{ mt: 3.5 }}>
                            <Box>
                                <Typography component="label" htmlFor="admin-cat-name" sx={categoryModalLabelSx}>
                                    Tên danh mục
                                </Typography>
                                <TextField
                                    id="admin-cat-name"
                                    name="categoryName"
                                    hiddenLabel
                                    required
                                    placeholder="Nhập tên danh mục"
                                    value={formName}
                                    error={!!formErrors.name}
                                    helperText={formErrors.name || undefined}
                                    onChange={(e) => {
                                        const v = e.target.value.slice(0, CATEGORY_NAME_MAX);
                                        setFormName(v);
                                        setFormErrors((prev) => ({ ...prev, name: '' }));
                                        setError('');
                                    }}
                                    fullWidth
                                    inputProps={{ maxLength: CATEGORY_NAME_MAX }}
                                    InputProps={{
                                        endAdornment: !formErrors.name ? (
                                            <InputAdornment position="end" sx={{ ml: 0.5, alignSelf: 'center' }}>
                                                <Typography component="span" sx={categoryModalCounterSx}>
                                                    {formName.length} / {CATEGORY_NAME_MAX}
                                                </Typography>
                                            </InputAdornment>
                                        ) : undefined,
                                    }}
                                    sx={categoryModalFieldSx}
                                />
                            </Box>

                            <Box>
                                <Typography component="label" htmlFor="admin-cat-desc" sx={categoryModalLabelSx}>
                                    Mô tả
                                </Typography>
                                <Box sx={{ position: 'relative' }}>
                                    <TextField
                                        id="admin-cat-desc"
                                        name="categoryDescription"
                                        hiddenLabel
                                        required
                                        placeholder="Mô tả ngắn gọn cho danh mục"
                                        value={formDescription}
                                        error={!!formErrors.description}
                                        helperText={formErrors.description || undefined}
                                        onChange={(e) => {
                                            const v = e.target.value.slice(0, CATEGORY_DESC_MAX);
                                            setFormDescription(v);
                                            setFormErrors((prev) => ({ ...prev, description: '' }));
                                            setError('');
                                        }}
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        inputProps={{
                                            maxLength: CATEGORY_DESC_MAX,
                                            style: { outline: 'none', boxShadow: 'none' },
                                        }}
                                        sx={[
                                            ...categoryModalFieldSx,
                                            {
                                                '& .MuiInputBase-root': { alignItems: 'flex-start', pb: 2.5 },
                                                '& textarea': { outline: 'none !important', boxShadow: 'none !important' },
                                            },
                                        ]}
                                    />
                                    {!formErrors.description ? (
                                        <Typography
                                            component="span"
                                            sx={{
                                                ...categoryModalCounterSx,
                                                position: 'absolute',
                                                right: 14,
                                                bottom: 12,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            {formDescription.length} / {CATEGORY_DESC_MAX}
                                        </Typography>
                                    ) : null}
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1.5,
                                    p: 2,
                                    borderRadius: 2.5,
                                    bgcolor: 'rgba(30, 58, 95, 0.32)',
                                    border: '1px solid rgba(99, 102, 241, 0.22)',
                                }}
                            >
                                <InfoOutlinedIcon
                                    sx={{ color: 'rgba(129, 140, 248, 0.95)', fontSize: 22, flexShrink: 0, mt: 0.15 }}
                                />
                                <Typography variant="body2" sx={{ color: palette.textMuted, fontSize: 13.5, lineHeight: 1.65 }}>
                                    {categoryDialogCopy.infoVi}
                                </Typography>
                            </Box>

                            {dialogMode === 'edit' ? (
                                <Box>
                                    <Typography component="label" htmlFor="admin-cat-parent" sx={categoryModalLabelSx}>
                                        Danh mục cha
                                    </Typography>
                                    <Select
                                        id="admin-cat-parent"
                                        value={formParentId ?? ''}
                                        onChange={(e) => setFormParentId(e.target.value === '' ? null : Number(e.target.value))}
                                        fullWidth
                                        displayEmpty
                                        MenuProps={parentSelectMenuProps}
                                        sx={{
                                            color: '#fff',
                                            bgcolor: 'rgba(0,0,0,0.4)',
                                            borderRadius: 2,
                                            outline: 'none',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(167,139,250,0.35)' },
                                            '&.Mui-focused': { outline: 'none', boxShadow: 'none' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: palette.purpleStrong,
                                                borderWidth: 1,
                                            },
                                            '& .MuiSvgIcon-root': { color: palette.textMuted },
                                        }}
                                    >
                                        <MenuItem value="">(Danh mục gốc)</MenuItem>
                                        {parentSelectOptions.map((opt, optIdx) => {
                                            const disabled = opt.id === editingId || descendantsOfEditing.has(opt.id);
                                            return (
                                                <MenuItem key={opt.id != null ? `p-${opt.id}` : `p-i-${optIdx}`} value={opt.id} disabled={disabled}>
                                                    {opt.name}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </Box>
                            ) : null}
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions
                    sx={{
                        px: { xs: 3, sm: 5 },
                        pb: { xs: 3, sm: 4 },
                        pt: 2,
                        gap: 1.5,
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                    }}
                >
                    <Button
                        onClick={closeDialog}
                        disabled={loading}
                        variant="text"
                        sx={{
                            color: 'rgba(255,255,255,0.88)',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 15,
                            px: 1.5,
                            minWidth: 0,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        disableElevation
                        onClick={handleSubmitDialog}
                        disabled={loading}
                        startIcon={
                            loading ? (
                                <CircularProgress size={18} sx={{ color: 'rgba(15,14,19,0.6)' }} />
                            ) : (
                                <Box
                                    sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(15,14,19,0.12)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <CheckIcon sx={{ fontSize: 15, color: '#0F0E13' }} />
                                </Box>
                            )
                        }
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 15,
                            borderRadius: 999,
                            px: 2.75,
                            py: 1.25,
                            color: '#0F0E13',
                            background: 'linear-gradient(180deg, #ddd6fe 0%, #a78bfa 55%, #9f7aea 100%)',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.35)',
                            '&:hover': {
                                background: 'linear-gradient(180deg, #e9e4ff 0%, #b59ffb 55%, #a78bfa 100%)',
                                boxShadow: '0 6px 24px rgba(139, 92, 246, 0.42)',
                            },
                            '&.Mui-disabled': {
                                color: 'rgba(15,14,19,0.35)',
                                background: 'rgba(167,139,250,0.35)',
                            },
                        }}
                    >
                        {dialogMode === 'edit' ? 'Cập nhật danh mục' : 'Lưu danh mục'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteConfirmOpen}
                onClose={closeDeleteDialog}
                maxWidth={false}
                aria-labelledby="delete-category-dialog-title"
                PaperProps={{ sx: deleteCategoryModalPaperSx }}
            >
                <DialogContent sx={{ p: 0, overflow: 'visible', position: 'relative' }}>
                    <IconButton
                        aria-label="Đóng"
                        onClick={closeDeleteDialog}
                        disabled={loading}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            zIndex: 1,
                            color: palette.textMuted,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: palette.text },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>

                    <Box sx={{ px: { xs: 3, sm: 5 }, pt: { xs: 4, sm: 5 }, pb: 2, textAlign: 'center' }}>
                        <Box
                            sx={{
                                width: 76,
                                height: 76,
                                mx: 'auto',
                                mb: 2.5,
                                borderRadius: '50%',
                                bgcolor: 'rgba(0,0,0,0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.2), 0 0 36px rgba(239,68,68,0.18)',
                            }}
                        >
                            <WarningIcon sx={{ fontSize: 44, color: '#f87171', filter: 'drop-shadow(0 0 10px rgba(248,113,113,0.45))' }} />
                        </Box>

                        <Typography
                            id="delete-category-dialog-title"
                            component="h2"
                            variant="h6"
                            sx={{ fontWeight: 800, color: palette.text, fontSize: { xs: '1.1rem', sm: '1.2rem' }, letterSpacing: '-0.02em', mb: 2 }}
                        >
                            Xác nhận xóa
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: palette.textMuted,
                                lineHeight: 1.75,
                                maxWidth: 360,
                                mx: 'auto',
                                fontSize: 14,
                            }}
                        >
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
                    </Box>
                </DialogContent>
                <DialogActions
                    sx={{
                        px: { xs: 3, sm: 4 },
                        pb: { xs: 3, sm: 3.5 },
                        pt: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        flexWrap: 'wrap',
                        gap: 1.5,
                    }}
                >
                    <Button
                        variant="text"
                        onClick={closeDeleteDialog}
                        disabled={loading}
                        sx={{
                            color: 'rgba(255,255,255,0.9)',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 15,
                            px: 1.5,
                            minWidth: 0,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        disableElevation
                        onClick={confirmDelete}
                        disabled={loading}
                        startIcon={
                            loading ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.85)' }} /> : null
                        }
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 15,
                            borderRadius: 999,
                            px: 3,
                            py: 1.2,
                            color: '#fff',
                            background: 'linear-gradient(90deg, #fca5a5 0%, #ef4444 42%, #dc2626 100%)',
                            boxShadow: '0 4px 22px rgba(239, 68, 68, 0.45)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #fecaca 0%, #f87171 40%, #ef4444 100%)',
                                boxShadow: '0 6px 28px rgba(239, 68, 68, 0.5)',
                            },
                            '&.Mui-disabled': {
                                color: 'rgba(255,255,255,0.5)',
                                background: 'rgba(239,68,68,0.35)',
                            },
                        }}
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
