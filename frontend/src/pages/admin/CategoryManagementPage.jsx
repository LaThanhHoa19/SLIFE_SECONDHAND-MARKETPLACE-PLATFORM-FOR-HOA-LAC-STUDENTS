import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from '../../api/categoryAdminApi';

const ROOT_PARENT_ID = null;

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
        byId.set(id, { ...c, id, children: [] });
    });

    const roots = [];
    flatList.forEach((c) => {
        const id = normalizeId(c.id ?? c.categoryId);
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
    const prefix = depth > 0 ? '└' : '';
    const folder = hasChildren ? (isExpanded ? FolderOpenIcon : FolderIcon) : FolderIcon;

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.75,
                    pl: depth * 2,
                    pr: 1,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(157,110,237,0.06)' },
                }}
            >
                {hasChildren ? (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(node.id);
                        }}
                        sx={{ width: 30, height: 30, borderRadius: 1.5 }}
                    >
                        {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 20 }} /> : <ChevronRightIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                ) : (
                    <Box sx={{ width: 30, flexShrink: 0 }} />
                )}

                {prefix ? (
                    <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(0,0,0,0.55)', minWidth: 14 }}>
                        {prefix}
                    </Typography>
                ) : null}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, color: 'rgb(157,110,237)' }}>
                        {(() => {
                            const Icon = folder;
                            return <Icon sx={{ fontSize: 20 }} />;
                        })()}
                    </Box>
                    <Typography
                        sx={{
                            fontSize: 13,
                            fontWeight: depth === 0 ? 800 : 600,
                            color: depth === 0 ? '#111827' : '#374151',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {node.name}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => onAddChild(node.id)} title="Thêm con">
                        <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => onEdit(node)} title="Sửa">
                        <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(node.id)} title="Xóa">
                        <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Stack>
            </Box>

            {hasChildren && isExpanded ? (
                <Box sx={{ pl: depth === 0 ? 0 : 0 }}>
                    {node.children.map((ch) => (
                        <Box key={ch.id ?? ch.name}>
                            <CategoryTreeNode
                                node={ch}
                                depth={depth + 1}
                                expandedParents={expandedParents}
                                onToggleExpand={onToggleExpand}
                                onAddChild={onAddChild}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </Box>
                    ))}
                </Box>
            ) : null}
        </Box>
    );
}

export default function CategoryManagementPage() {
    const [flatCategories, setFlatCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [expandedParents, setExpandedParents] = useState(new Set());

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('createRoot'); // createRoot | createChild | edit

    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formParentId, setFormParentId] = useState(ROOT_PARENT_ID);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const hasParentIdInApi = useMemo(() => {
        return flatCategories.some((c) => c.parentId !== undefined && c.parentId !== null);
    }, [flatCategories]);

    const categoryTree = useMemo(() => buildCategoryTree(flatCategories), [flatCategories]);

    const reload = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getAdminCategories();
            const raw = res?.data?.data ?? res?.data;
            const arr = Array.isArray(raw) ? raw : [];
            setFlatCategories(arr);
        } catch (e) {
            setError(e?.message || 'Không tải được danh mục.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading && categoryTree.length > 0) {
            const first = findFirstExpandableNode(categoryTree);
            if (first?.id != null) setExpandedParents(new Set([first.id]));
        }
    }, [loading, categoryTree]);

    const toggleCategoryExpand = (id) => {
        setExpandedParents((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openCreateRoot = () => {
        setDialogMode('createRoot');
        setFormName('');
        setFormDescription('');
        setFormParentId(ROOT_PARENT_ID);
        setDialogOpen(true);
    };

    const openCreateChild = (parentId) => {
        setDialogMode('createChild');
        setFormName('');
        setFormDescription('');
        setFormParentId(parentId ?? null);
        setDialogOpen(true);
    };

    const openEdit = (node) => {
        setDialogMode('edit');
        setFormName(node.name || '');
        setFormDescription(node.description || '');
        setFormParentId(node.parentId ?? null);
        setDialogOpen(true);
    };

    const closeDialog = () => setDialogOpen(false);

    const handleSubmitDialog = async () => {
        const payload = {
            name: formName.trim(),
            description: formDescription.trim() || null,
            parentId: formParentId ?? null,
        };

        try {
            if (dialogMode === 'createRoot') {
                await createAdminCategory(payload);
            } else if (dialogMode === 'createChild') {
                await createAdminCategory(payload);
            } else {
                // edit mode
                const editingId = flatCategories.find((c) => c.id === formParentId)?.id;
                // We'll store the editing id via closure: safer to pass it through state in the next step.
            }
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Có lỗi khi lưu danh mục.');
            return;
        } finally {
            // no-op
        }
    };

    // For edit/delete we need an explicit target id.
    const [editingId, setEditingId] = useState(null);

    const openEditWithId = (node) => {
        setEditingId(node.id ?? null);
        openEdit(node);
    };

    const openDelete = (id) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTargetId == null) return;
        try {
            await deleteAdminCategory(deleteTargetId);
            setDeleteConfirmOpen(false);
            setDeleteTargetId(null);
            await reload();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Xóa thất bại.');
        }
    };

    const handleSubmitDialog2 = async () => {
        const payload = {
            name: formName.trim(),
            description: formDescription.trim() || null,
            parentId: formParentId ?? null,
        };
        if (!payload.name) {
            setError('Tên danh mục bắt buộc.');
            return;
        }

        try {
            if (dialogMode === 'edit') {
                if (editingId == null) throw new Error('Missing editingId');
                await updateAdminCategory(editingId, payload);
            } else {
                await createAdminCategory(payload);
            }
            setDialogOpen(false);
            setEditingId(null);
            await reload();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Có lỗi khi lưu danh mục.');
        }
    };

    const flattenedOptions = useMemo(() => flatCategories.map((c) => ({ id: c.id, name: c.name })), [flatCategories]);
    const descendantsOfEditing = useMemo(() => collectDescendants(categoryTree, editingId), [categoryTree, editingId]);

    return (
        <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        Quản lý danh mục
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Xây dựng cây cha-con và quản lý CRUD danh mục.
                    </Typography>
                </Box>
                <Button variant="contained" onClick={openCreateRoot} startIcon={<AddIcon />}>
                    Thêm gốc
                </Button>
            </Stack>

            {!hasParentIdInApi ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    API admin chưa trả `parentId` (hoặc không có dữ liệu parentId). Danh mục sẽ được hiển thị dạng phẳng.
                </Alert>
            ) : null}

            {loading ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    ) : null}

                    <Divider sx={{ mb: 2 }} />

                    {categoryTree.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Chưa có danh mục nào.
                        </Typography>
                    ) : (
                        <Box>
                            {categoryTree.map((node) => (
                                <CategoryTreeNode
                                    key={node.id ?? node.name}
                                    node={node}
                                    depth={0}
                                    expandedParents={expandedParents}
                                    onToggleExpand={toggleCategoryExpand}
                                    onAddChild={openCreateChild}
                                    onEdit={openEditWithId}
                                    onDelete={openDelete}
                                />
                            ))}
                        </Box>
                    )}
                </>
            )}

            {/* Create/Edit dialog */}
            <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === 'edit' ? 'Sửa danh mục' : dialogMode === 'createChild' ? 'Thêm danh mục con' : 'Thêm danh mục gốc'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {dialogMode === 'createChild' ? (
                            <Alert severity="info">Danh mục con sẽ được gán theo `parentId` của node đã chọn.</Alert>
                        ) : null}

                        <TextField label="Tên danh mục" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth />
                        <TextField
                            label="Mô tả"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        {dialogMode === 'edit' ? (
                            <>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    Cha (parentId)
                                </Typography>
                                <Select
                                    value={formParentId ?? ''}
                                    onChange={(e) => setFormParentId(e.target.value === '' ? null : Number(e.target.value))}
                                    fullWidth
                                >
                                    <MenuItem value="">(Danh mục gốc)</MenuItem>
                                    {flattenedOptions.map((opt) => {
                                        const disabled = opt.id === editingId || descendantsOfEditing.has(opt.id);
                                        return (
                                            <MenuItem key={opt.id} value={opt.id} disabled={disabled}>
                                                {opt.name}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="contained" onClick={handleSubmitDialog2} disabled={loading}>
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirm dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Xóa danh mục này? Danh mục con (nếu có) sẽ được gán `parentId = null` (theo ràng buộc DB).
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="contained" color="error" onClick={confirmDelete} disabled={loading}>
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

