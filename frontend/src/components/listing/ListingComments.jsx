import { useState, useEffect, useCallback } from 'react';
import {
  Avatar, Box, IconButton, InputAdornment, TextField, Typography,
  CircularProgress, Menu, MenuItem, ListItemIcon, ListItemText,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { fullImageUrl } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as listingApi from '../../api/listingApi';

export const BORDER = 'rgba(255,255,255,0.1)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.45)';
export const PURPLE = '#9D6EED';

const BUBBLE_BG = 'rgba(255, 255, 255, 0.05)';

// Sub-component 1: Comment Input
const CommentInput = ({ 
  listingId, 
  currentUser, 
  fetchComments, 
  onNotify, 
  autoFocus = false, 
  parentId = null, 
  targetName = null, 
  onCancel = null, 
  placeholder = "Để lại lời nhắn..." 
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (parentId) {
        await listingApi.replyToComment(parentId, { content: inputText.trim() });
      } else {
        await listingApi.createComment({ listingId, content: inputText.trim() });
      }
      setInputText('');
      if (onCancel) onCancel();
      await fetchComments(true);
      if (onNotify) onNotify(parentId ? 'Đã phản hồi!' : 'Đã bình luận!');
    } catch (err) {
      if (onNotify) onNotify('Lỗi gửi bình luận.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: parentId ? 1 : 0, mt: parentId ? 1.5 : 0 }}>
      <Avatar
        src={fullImageUrl(currentUser?.avatarUrl)}
        sx={{
          width: parentId ? 28 : 36, height: parentId ? 28 : 36,
          border: `1px solid ${BORDER}`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {currentUser?.fullName?.charAt(0) || 'U'}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <TextField
          fullWidth multiline rows={1} autoFocus={autoFocus}
          value={inputText} onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={targetName ? `Trả lời ${targetName}...` : placeholder}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSend} disabled={!inputText.trim() || isSubmitting} sx={{ color: inputText.trim() ? PURPLE : TEXT_SEC }}>
                  {isSubmitting ? <CircularProgress size={18} /> : <SendIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '18px', color: TEXT_PRI, padding: '8px 14px',
              '& fieldset': { border: `1px solid ${BORDER}` },
              '&.Mui-focused fieldset': { borderColor: PURPLE }
            }
          }}
        />
        {onCancel && (
          <Typography fontSize={11} sx={{ mt: 0.5, pl: 1, cursor: 'pointer', color: TEXT_SEC, '&:hover': { color: '#fff' } }} onClick={onCancel}>
            Hủy
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Sub-component 2: Comment Item
const CommentItem = ({ 
  comment, 
  currentUser, 
  editingId, 
  setEditingId, 
  replyingTo, 
  setReplyingTo, 
  onUpdateCallback, 
  setSelectedComment, 
  setDeleteConfirmOpen, 
  listingId, 
  fetchComments, 
  onNotify,
  depth = 0, 
  isLast = false 
}) => {
  const author = comment.author || {};
  const authorId = author.userId || author.id;
  const isOwner = String(authorId) === String(currentUser?.id || currentUser?.userId);
  const isEditing = editingId === comment.id;
  const isReply = depth > 0;
  
  // LOCAL state for editing to prevent cursor jumping
  const [localEditValue, setLocalEditValue] = useState(comment.content);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Sync local edit value when entering editing mode
  useEffect(() => {
    if (isEditing) {
      setLocalEditValue(comment.content);
    }
  }, [isEditing, comment.content]);

  const handleSaveEdit = () => {
    onUpdateCallback(comment.id, localEditValue);
  };

  return (
    <Box sx={{ mb: isReply ? 1 : 2, position: 'relative' }}>
      {/* Thread lines */}
      {isReply && (
        <>
          <Box sx={{
            position: 'absolute', left: -26, top: -16, width: 26, height: 30,
            borderLeft: `1.5px solid ${BORDER}`, borderBottom: `1.5px solid ${BORDER}`,
            borderBottomLeftRadius: '12px', zIndex: 0
          }} />
          {!isLast && (
            <Box sx={{
              position: 'absolute', left: -26, top: 14, bottom: -20,
              borderLeft: `1.5px solid ${BORDER}`, zIndex: 0
            }} />
          )}
        </>
      )}

      <Box sx={{ display: 'flex', gap: isReply ? 1 : 1.2, zIndex: 1, position: 'relative' }}>
        <Avatar
          component={RouterLink} to={isOwner ? '/profile' : `/profile/${authorId || ''}`}
          src={fullImageUrl(author.avatarUrl)}
          sx={{
            width: isReply ? 28 : 36, height: isReply ? 28 : 36,
            border: `1px solid ${BORDER}`, bgcolor: 'rgba(255,255,255,0.05)'
          }}
        >
          {author?.fullName?.charAt(0) || 'U'}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <Box sx={{ bgcolor: 'rgba(157, 110, 237, 0.05)', p: 1, borderRadius: '16px', border: `1px solid ${PURPLE}` }}>
              <TextField
                fullWidth multiline size="small" autoFocus
                value={localEditValue}
                onChange={(e) => setLocalEditValue(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { color: TEXT_PRI, fontSize: 14, '& fieldset': { border: 'none' } } }}
              />
              <Box sx={{ mt: 0.5, display: 'flex', gap: 2, px: 1 }}>
                <Typography fontSize={11} fontWeight={800} color={PURPLE} sx={{ cursor: 'pointer' }} onClick={handleSaveEdit}>LƯU</Typography>
                <Typography fontSize={11} color={TEXT_SEC} sx={{ cursor: 'pointer' }} onClick={() => setEditingId(null)}>HỦY</Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ bgcolor: BUBBLE_BG, borderRadius: '18px', px: 1.5, py: 0.8, maxWidth: '92%' }}>
                <Typography
                  component={RouterLink} to={isOwner ? '/profile' : `/profile/${authorId || ''}`}
                  variant="caption" sx={{ fontWeight: 700, color: '#fff', display: 'block', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {author?.fullName || 'Người dùng'}
                </Typography>
                <Typography fontSize={14.5} color={TEXT_PRI} sx={{ lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {comment.content}
                </Typography>
              </Box>
              {isOwner && (
                <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ ml: 0.5, color: TEXT_SEC, '&:hover': { color: '#fff' } }}>
                  <MoreIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 0.4, pl: 1, alignItems: 'center', color: TEXT_SEC }}>
            <Typography fontSize={11}>{formatDate(comment.createdAt)}</Typography>
            <Box component="span" sx={{ fontSize: 10 }}>·</Box>
            <Typography
              fontSize={11} fontWeight={700} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => setReplyingTo(comment.id)}
            >
              Trả lời
            </Typography>
          </Box>

          {replyingTo === comment.id && currentUser && (
            <CommentInput 
              listingId={listingId} currentUser={currentUser} fetchComments={fetchComments} onNotify={onNotify}
              autoFocus parentId={comment.id} targetName={author.fullName} onCancel={() => setReplyingTo(null)} 
            />
          )}
        </Box>
      </Box>

      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ pl: depth < 2 ? 5.5 : 0, mt: 1, position: 'relative' }}>
          {comment.replies.map((r, idx) => (
            <CommentItem 
              key={r.id} comment={r} 
              currentUser={currentUser} editingId={editingId} setEditingId={setEditingId}
              replyingTo={replyingTo} setReplyingTo={setReplyingTo}
              onUpdateCallback={onUpdateCallback} 
              setSelectedComment={setSelectedComment} setDeleteConfirmOpen={setDeleteConfirmOpen}
              listingId={listingId} fetchComments={fetchComments} onNotify={onNotify}
              depth={depth + 1} isLast={idx === comment.replies.length - 1} 
            />
          ))}
        </Box>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setEditingId(comment.id); setMenuAnchor(null); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Sửa</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSelectedComment(comment); setDeleteConfirmOpen(true); setMenuAnchor(null); }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#f02849' }} /></ListItemIcon>
          <ListItemText sx={{ color: '#f02849' }}>Xóa</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

// Main Export Component
export default function ListingComments({ listingId, onNotify }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null); // Just store the ID being edited
  const [showAll, setShowAll] = useState(false);

  const [selectedComment, setSelectedComment] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchComments = useCallback(async (silent = false) => {
    if (!listingId) return;
    if (!silent && comments.length === 0) setLoading(true);
    try {
      const res = await listingApi.getComments(listingId);
      const data = res?.data?.data || res?.data || [];
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => (b.id - a.id)) : [];
      setComments(sorted);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [listingId, comments.length]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleUpdate = async (id, newContent) => {
    if (!newContent.trim()) return;
    try {
      await listingApi.updateComment(id, { content: newContent.trim() });
      setEditingId(null);
      await fetchComments(true);
      if (onNotify) onNotify('Đã cập nhật bình luận!');
    } catch (err) {
      if (onNotify) onNotify('Không thể cập nhật bình luận.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!selectedComment) return;
    try {
      await listingApi.deleteComment(selectedComment.id);
      await fetchComments(true);
      if (onNotify) onNotify('Đã xóa bình luận!');
    } catch (err) {
      if (onNotify) onNotify('Không thể xóa bình luận.', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedComment(null);
    }
  };

  return (
    <Box sx={{ p: 0, position: 'relative', minHeight: comments.length > 0 ? '150px' : 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, flex: 1, pb: 5 }}>
        <Typography fontSize={15} fontWeight={800} color={TEXT_PRI} sx={{ mb: 2.5 }}>
          {comments.length > 0 ? `${comments.length} bình luận` : 'Chưa có bình luận'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : (
          <Box>
            {(showAll ? comments : comments.slice(0, 3)).map(c => (
              <CommentItem 
                key={c.id} comment={c} 
                currentUser={currentUser} editingId={editingId} setEditingId={setEditingId}
                replyingTo={replyingTo} setReplyingTo={setReplyingTo}
                onUpdateCallback={handleUpdate}
                setSelectedComment={setSelectedComment} setDeleteConfirmOpen={setDeleteConfirmOpen}
                listingId={listingId} fetchComments={fetchComments} onNotify={onNotify}
              />
            ))}
            {comments.length > 3 && (
              <Typography
                fontSize={13} fontWeight={700} color={PURPLE} textAlign="center" sx={{ mt: 2, cursor: 'pointer' }}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Thu gọn' : `Xem thêm ${comments.length - 3} bình luận`}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        bgcolor: 'rgba(26, 22, 31, 0.95)', p: 1.5,
        borderTop: `1px solid ${BORDER}`, zIndex: 10,
        backdropFilter: 'blur(12px)', boxShadow: '0 -10px 30px rgba(0,0,0,0.4)'
      }}>
        {currentUser ? (
          <CommentInput 
            listingId={listingId} currentUser={currentUser} fetchComments={fetchComments} onNotify={onNotify} 
            placeholder="Bình luận dưới tên bạn..." 
          />
        ) : (
          <Box
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
            sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}
          >
            <Typography fontSize={13} color={TEXT_SEC}>Đăng nhập để bình luận...</Typography>
          </Box>
        )}
      </Box>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa?</DialogTitle>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Hủy</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
