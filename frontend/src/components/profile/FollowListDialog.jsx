import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import * as followApi from '../../api/followApi';
import { fullImageUrl } from '../../utils/constants';

const PAGE_SIZE = 20;
const PURPLE = '#9D6EED';

function unwrapPage(res) {
    const body = res?.data;
    const payload = body?.data ?? body;
    if (!payload || typeof payload !== 'object') return null;
    return payload;
}

/**
 * @param {{ open: boolean; onClose: () => void; mode: 'followers' | 'following'; userId: number | null }} props
 */
export default function FollowListDialog({ open, onClose, mode, userId }) {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(0);
    const [last, setLast] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const title = mode === 'followers' ? 'Người theo dõi' : 'Đang theo dõi';

    const fetchPage = useCallback(
        async (pageIndex, append) => {
            if (userId == null) return;
            if (append) setLoadingMore(true);
            else setLoading(true);
            setError(null);
            try {
                const api = mode === 'followers' ? followApi.getFollowers : followApi.getFollowing;
                const res = await api(userId, { page: pageIndex, size: PAGE_SIZE });
                const p = unwrapPage(res);
                const content = Array.isArray(p?.content) ? p.content : [];
                setRows((prev) => (append ? [...prev, ...content] : content));
                setLast(!!p?.last);
                setPage(pageIndex);
            } catch (e) {
                setError(e?.message || 'Không tải được danh sách.');
                if (!append) setRows([]);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [userId, mode],
    );

    useEffect(() => {
        if (!open || userId == null) return;
        setRows([]);
        setPage(0);
        setLast(true);
        fetchPage(0, false);
    }, [open, userId, mode, fetchPage]);

    const handleLoadMore = () => {
        if (!last && !loadingMore && !loading) fetchPage(page + 1, true);
    };

    const handleRowClick = (profileId) => {
        onClose();
        navigate(`/profile/${profileId}`);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                {title}
                <IconButton aria-label="Đóng" onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ px: 1, minHeight: 200 }}>
                {loading && rows.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                        <CircularProgress size={36} sx={{ color: PURPLE }} />
                    </Box>
                ) : error && rows.length === 0 ? (
                    <Typography color="error" variant="body2" sx={{ py: 2, px: 1 }}>
                        {error}
                    </Typography>
                ) : rows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, px: 1 }}>
                        {mode === 'followers' ? 'Chưa có người theo dõi.' : 'Chưa theo dõi ai.'}
                    </Typography>
                ) : (
                    <>
                        <List disablePadding>
                            {rows.map((u) => {
                                const rid = u.id;
                                const name = u.fullName || 'Người dùng';
                                const rep = u.reputationScore != null ? Number(u.reputationScore).toFixed(1) : '—';
                                return (
                                    <ListItemButton
                                        key={`${mode}-${rid}`}
                                        onClick={() => rid != null && handleRowClick(rid)}
                                        sx={{ borderRadius: 1, mb: 0.5 }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={fullImageUrl(u.avatarUrl) || undefined} alt={name} sx={{ border: `1px solid ${PURPLE}33` }} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={name}
                                            primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
                                            secondary={
                                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    <StarIcon sx={{ fontSize: 14, color: '#FFC107' }} />
                                                    <Typography component="span" variant="caption" color="text.secondary">
                                                        Uy tín {rep}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                        {!last && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={loadingMore}
                                    onClick={handleLoadMore}
                                    sx={{ textTransform: 'none', borderColor: PURPLE, color: PURPLE }}
                                >
                                    {loadingMore ? <CircularProgress size={20} sx={{ color: PURPLE }} /> : 'Xem thêm'}
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
