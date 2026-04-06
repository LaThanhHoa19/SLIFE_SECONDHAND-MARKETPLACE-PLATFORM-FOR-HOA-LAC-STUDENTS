import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Avatar,
    Box,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
    CircularProgress,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Tooltip,
} from '@mui/material';
import {
    Send as SendIcon,
    Close as CloseIcon,
    MoreVert as MoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { fullImageUrl } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { unwrapApiData } from '../../utils/apiPayload';
import {
    createCommunityPostComment,
    deleteCommunityPostComment,
    getCommunityPostComments,
    replyCommunityPostComment,
    updateCommunityPostComment,
} from '../../api/communityApi';
import { BORDER, PURPLE, TEXT_PRI, TEXT_SEC } from '../listing/ListingComments';

const BUBBLE_BG = 'rgba(255, 255, 255, 0.04)';
const BUBBLE_BORDER = 'rgba(255, 255, 255, 0.08)';

/**
 * Bình luận bài cộng đồng — cùng giao diện với ListingComments, API /api/v1/community-posts/...
 */
export default function CommunityPostComments({ postId, onNotify, onThreadDelta }) {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const inputDomId = useMemo(() => `community-cmt-${postId}`, [postId]);

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [text, setText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const fetchComments = useCallback(
        async (silent = false) => {
            if (!postId) return;
            if (!silent) setLoading(true);
            try {
                const res = await getCommunityPostComments(postId);
                const data = unwrapApiData(res);
                const sorted = Array.isArray(data) ? [...data].sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
                setComments(sorted);
            } catch (err) {
                console.error('Failed to fetch community comments:', err);
            } finally {
                setLoading(false);
            }
        },
        [postId],
    );

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async () => {
        if (!currentUser) return;
        if (!text.trim() || submitting) return;
        setSubmitting(true);
        const wasReply = !!replyingTo;
        try {
            if (replyingTo) {
                await replyCommunityPostComment(replyingTo.id, { content: text.trim() });
            } else {
                await createCommunityPostComment(postId, { content: text.trim() });
            }
            setText('');
            setReplyingTo(null);
            await fetchComments(true);
            onThreadDelta?.(1);
            if (onNotify) onNotify(wasReply ? 'Đã gửi phản hồi!' : 'Đã gửi bình luận!');
        } catch (err) {
            if (onNotify) onNotify(err?.response?.data?.message || 'Không gửi được bình luận.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedComment) return;
        setLoading(true);
        try {
            await deleteCommunityPostComment(selectedComment.id);
            await fetchComments(true);
            onThreadDelta?.(-1);
            if (onNotify) onNotify('Đã xóa bình luận!');
        } catch (err) {
            if (onNotify) onNotify('Không thể xóa bình luận.', 'error');
        } finally {
            setLoading(false);
            setDeleteConfirmOpen(false);
            setSelectedComment(null);
        }
    };

    const handleUpdate = async () => {
        if (!editingComment || !editingComment.content.trim()) return;
        setSubmitting(true);
        try {
            await updateCommunityPostComment(editingComment.id, { content: editingComment.content.trim() });
            setEditingComment(null);
            await fetchComments(true);
            if (onNotify) onNotify('Đã cập nhật bình luận!');
        } catch (err) {
            if (onNotify) onNotify('Không thể cập nhật bình luận.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const CommentItem = ({
        comment,
        depth = 0,
        currentUser: cu,
        editingComment: ec,
        setEditingComment: sec,
        handleUpdate: hu,
        setReplyingTo: srt,
        setSelectedComment: ssc,
        setDeleteConfirmOpen: sdco,
    }) => {
        const author = comment.author || {};
        const authorId = author.userId || author.id;
        const isMyComment = String(authorId) === String(cu?.id ?? cu?.userId);
        const isEditing = ec?.id === comment.id;
        const [menuAnchor, setMenuAnchor] = useState(null);

        return (
            <Box sx={{ mb: 2.5, position: 'relative' }}>
                <Box sx={{ display: 'flex', gap: 1.2 }}>
                    <Avatar
                        component={RouterLink}
                        to={authorId === (cu?.id ?? cu?.userId) ? '/profile' : `/profile/${authorId || ''}`}
                        src={fullImageUrl(author.avatarUrl)}
                        sx={{
                            width: 34,
                            height: 34,
                            mt: 0.1,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            bgcolor: PURPLE,
                            border: isMyComment ? `1.5px solid ${PURPLE}` : `1px solid ${BORDER}`,
                        }}
                    >
                        {author?.fullName ? author.fullName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                            <Box
                                sx={{
                                    width: '100%',
                                    p: 1,
                                    borderRadius: '16px',
                                    border: `1px solid ${PURPLE}`,
                                    animation: 'pulse-glow 2s infinite',
                                    '@keyframes pulse-glow': {
                                        '0%': { boxShadow: `0 0 0 0 ${PURPLE}22` },
                                        '50%': { boxShadow: `0 0 10px 0 ${PURPLE}44` },
                                        '100%': { boxShadow: `0 0 0 0 ${PURPLE}22` },
                                    },
                                }}
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    size="small"
                                    autoFocus
                                    value={ec.content}
                                    onFocus={(e) => {
                                        const len = e.currentTarget.value.length;
                                        e.currentTarget.setSelectionRange(len, len);
                                    }}
                                    onChange={(e) => sec({ ...ec, content: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'transparent',
                                            color: TEXT_PRI,
                                            fontSize: 14,
                                            '& fieldset': { border: 'none' },
                                        },
                                    }}
                                />
                                <Box sx={{ mt: 1, display: 'flex', gap: 2, px: 1 }}>
                                    <Typography
                                        fontSize={11}
                                        fontWeight={700}
                                        color={PURPLE}
                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                        onClick={hu}
                                    >
                                        LƯU
                                    </Typography>
                                    <Typography
                                        fontSize={11}
                                        fontWeight={600}
                                        color={TEXT_SEC}
                                        sx={{ cursor: 'pointer', '&:hover': { color: '#fff' } }}
                                        onClick={() => sec(null)}
                                    >
                                        HỦY
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '100%' }}>
                                <Box
                                    sx={{
                                        bgcolor: BUBBLE_BG,
                                        borderRadius: '16px',
                                        px: 1.8,
                                        py: 1.2,
                                        border: `1px solid ${BUBBLE_BORDER}`,
                                        maxWidth: '100%',
                                        position: 'relative',
                                        '&:hover .more-btn': { opacity: 1 },
                                    }}
                                >
                                    <Typography
                                        component={RouterLink}
                                        to={authorId === (cu?.id ?? cu?.userId) ? '/profile' : `/profile/${authorId || ''}`}
                                        fontSize={12}
                                        fontWeight={800}
                                        color={PURPLE}
                                        sx={{ mb: 0.1, textDecoration: 'none', cursor: 'pointer', '&:hover': { color: '#fff' } }}
                                    >
                                        {author?.fullName || 'Người dùng'}
                                    </Typography>
                                    <Typography
                                        fontSize={14}
                                        color={TEXT_PRI}
                                        sx={{ lineHeight: 1.5, wordBreak: 'break-word', fontWeight: 400 }}
                                    >
                                        {comment.content}
                                    </Typography>
                                </Box>
                                {isMyComment && (
                                    <Tooltip title="Tùy chọn bình luận">
                                        <IconButton
                                            size="small"
                                            className="more-btn"
                                            onClick={(e) => setMenuAnchor(e.currentTarget)}
                                            sx={{
                                                ml: 0.5,
                                                color: TEXT_SEC,
                                                opacity: 0.6,
                                                transition: 'all 0.2s',
                                                '&:hover': { color: PURPLE, opacity: 1, bgcolor: 'rgba(255,255,255,0.05)' },
                                            }}
                                        >
                                            <MoreIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 2.2, alignItems: 'center', mt: 0.6, pl: 1 }}>
                            <Typography fontSize={11} color={TEXT_SEC} sx={{ fontWeight: 500 }}>
                                {formatDate(comment.createdAt)}
                            </Typography>
                            <Typography
                                sx={{
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: TEXT_SEC,
                                    '&:hover': { color: PURPLE },
                                }}
                                onClick={() => {
                                    srt({ id: comment.id, name: author?.fullName || 'Người dùng' });
                                    document.getElementById(inputDomId)?.focus();
                                }}
                            >
                                Phản hồi
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                {isMyComment && (
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: {
                                bgcolor: '#1E1B28',
                                border: `1px solid ${BORDER}`,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                '& .MuiMenuItem-root': {
                                    fontSize: 13,
                                    py: 1,
                                    px: 2,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                },
                            },
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                sec({ id: comment.id, content: comment.content });
                                setMenuAnchor(null);
                            }}
                        >
                            <ListItemIcon>
                                <EditIcon fontSize="small" sx={{ color: TEXT_SEC }} />
                            </ListItemIcon>
                            <ListItemText sx={{ color: TEXT_PRI }}>Sửa</ListItemText>
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                ssc(comment);
                                sdco(true);
                                setMenuAnchor(null);
                            }}
                        >
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" sx={{ color: '#FF4D4D' }} />
                            </ListItemIcon>
                            <ListItemText sx={{ color: '#FF4D4D' }}>Xóa</ListItemText>
                        </MenuItem>
                    </Menu>
                )}
                {comment.replies && comment.replies.length > 0 && (
                    <Box sx={{ pl: 4.5, mt: 2, borderLeft: `1px solid ${BORDER}`, ml: 2 }}>
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                depth={depth + 1}
                                currentUser={cu}
                                editingComment={ec}
                                setEditingComment={sec}
                                handleUpdate={hu}
                                setReplyingTo={srt}
                                setSelectedComment={ssc}
                                setDeleteConfirmOpen={sdco}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box
            sx={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
                '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
            }}
        >
            <Box sx={{ px: 2, pt: 1 }}>
                <Typography fontSize={15} fontWeight={800} color={TEXT_PRI} sx={{ mb: 2 }}>
                    {comments.length > 0 ? `${comments.length} bình luận` : 'Chưa có bình luận'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 3 }}>
                    {currentUser ? (
                        <>
                            <Avatar
                                src={fullImageUrl(currentUser?.avatarUrl)}
                                sx={{
                                    width: 38,
                                    height: 38,
                                    mt: 0.5,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${BORDER}`,
                                }}
                            >
                                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                            <TextField
                                fullWidth
                                multiline
                                rows={1}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                id={inputDomId}
                                placeholder={replyingTo ? `Phản hồi ${replyingTo.name}...` : 'Để lại lời nhắn...'}
                                variant="outlined"
                                disabled={submitting}
                                InputProps={{
                                    startAdornment: replyingTo && (
                                        <InputAdornment position="start">
                                            <Box
                                                sx={{
                                                    bgcolor: `${PURPLE}22`,
                                                    color: PURPLE,
                                                    px: 1.2,
                                                    py: 0.4,
                                                    borderRadius: '8px',
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                }}
                                            >
                                                @{replyingTo.name}
                                                <IconButton size="small" onClick={() => setReplyingTo(null)} sx={{ p: 0, color: PURPLE }}>
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={handleSubmit}
                                                disabled={!text.trim() || submitting}
                                                sx={{
                                                    color: text.trim() ? PURPLE : TEXT_SEC,
                                                    transition: 'all 0.2s',
                                                    opacity: text.trim() ? 1 : 0.6,
                                                }}
                                            >
                                                {submitting ? (
                                                    <CircularProgress size={18} color="inherit" />
                                                ) : (
                                                    <SendIcon sx={{ fontSize: 18 }} />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        borderRadius: '20px',
                                        color: TEXT_PRI,
                                        padding: '8px 14px',
                                        '& fieldset': { border: `1px solid ${BORDER}` },
                                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                                        '&.Mui-focused fieldset': { borderColor: PURPLE, borderWidth: '1px' },
                                    },
                                    '& input::placeholder': { color: TEXT_SEC, opacity: 0.6 },
                                }}
                            />
                        </>
                    ) : (
                        <Box
                            onClick={() => navigate('/login', { state: { from: location.pathname } })}
                            sx={{
                                width: '100%',
                                cursor: 'pointer',
                                p: 1.8,
                                px: 2.5,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${BORDER}`,
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)' },
                            }}
                        >
                            <Typography fontSize={14} color={TEXT_SEC} sx={{ fontStyle: 'italic', opacity: 0.6 }}>
                                Vui lòng{' '}
                                <Box component="span" sx={{ color: PURPLE, fontWeight: 800, textDecoration: 'underline' }}>
                                    Đăng nhập
                                </Box>{' '}
                                để bình luận bài cộng đồng này...
                            </Typography>
                            <SendIcon sx={{ fontSize: 18, color: TEXT_SEC, opacity: 0.6 }} />
                        </Box>
                    )}
                </Box>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: PURPLE }} />
                    </Box>
                ) : comments.length === 0 ? (
                    <Typography fontSize={13} color={TEXT_SEC} textAlign="center" sx={{ py: 4 }}>
                        Chưa có gì ở đây. Hãy mở lời trước nhé!
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', pb: 2 }}>
                        {(showAll ? comments : comments.slice(0, 3)).map((c) => (
                            <CommentItem
                                key={c.id}
                                comment={c}
                                currentUser={currentUser}
                                editingComment={editingComment}
                                setEditingComment={setEditingComment}
                                handleUpdate={handleUpdate}
                                setReplyingTo={setReplyingTo}
                                setSelectedComment={setSelectedComment}
                                setDeleteConfirmOpen={setDeleteConfirmOpen}
                            />
                        ))}
                        {comments.length > 3 && !showAll && (
                            <Typography
                                onClick={() => setShowAll(true)}
                                fontSize={13}
                                fontWeight={700}
                                sx={{
                                    color: '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    mt: 2,
                                    py: 1,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    width: 'fit-content',
                                    px: 3,
                                    mx: 'auto',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: PURPLE },
                                }}
                            >
                                Xem thêm {comments.length - 3} bình luận khác
                            </Typography>
                        )}
                        {showAll && comments.length > 3 && (
                            <Typography
                                onClick={() => setShowAll(false)}
                                fontSize={13}
                                fontWeight={700}
                                sx={{
                                    color: TEXT_SEC,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    mt: 2,
                                    py: 1,
                                    bgcolor: 'transparent',
                                    borderRadius: '12px',
                                    width: 'fit-content',
                                    px: 3,
                                    mx: 'auto',
                                    transition: 'all 0.2s',
                                    border: `1px solid ${BORDER}`,
                                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
                                }}
                            >
                                Thu gọn bình luận
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                PaperProps={{
                    sx: { bgcolor: '#1A161F', color: TEXT_PRI, borderRadius: '16px', border: `1px solid ${BORDER}` },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: TEXT_SEC }}>Bình luận này sẽ hoàn toàn biến mất.</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: TEXT_SEC, fontWeight: 700 }}>
                        HỦY
                    </Button>
                    <Button onClick={confirmDelete} sx={{ color: '#FF4D4D', fontWeight: 700 }}>
                        XÓA BỎ
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
