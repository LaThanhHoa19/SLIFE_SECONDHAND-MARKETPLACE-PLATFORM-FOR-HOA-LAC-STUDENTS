import { useState, useEffect, useCallback } from 'react';
import { Avatar, Box, IconButton, InputAdornment, TextField, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { fullImageUrl } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { Link as RouterLink } from 'react-router-dom';
import * as listingApi from '../../api/listingApi';

export const CARD_BG2 = '#252230';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

export default function ListingComments({ listingId, currentUser, onNotify }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, name }

  const fetchComments = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    try {
      const res = await listingApi.getComments(listingId);
      const data = res?.data?.data || res?.data || [];
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (replyingTo) {
        await listingApi.replyToComment(replyingTo.id, { content: text.trim() });
      } else {
        await listingApi.createComment({ listingId, content: text.trim() });
      }
      setText('');
      setReplyingTo(null);
      await fetchComments(); // Reload all comments
      if (onNotify) onNotify(replyingTo ? 'Đã gửi phản hồi!' : 'Đã gửi bình luận!');
    } catch (err) {
      if (onNotify) onNotify(err?.response?.data?.message || 'Không gửi được bình luận.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const CommentItem = ({ comment, depth = 0 }) => {
    const author = comment.author || {};
    const authorId = author.userId || author.id;

    return (
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Avatar
            component={RouterLink}
            to={authorId === (currentUser?.id ?? currentUser?.userId) ? '/profile' : `/profile/${authorId || ''}`}
            src={fullImageUrl(author.avatarUrl)}
            sx={{ width: 36, height: 36, mt: 0.3, cursor: 'pointer', textDecoration: 'none', bgcolor: PURPLE }}
          >
            {author.fullName ? author.fullName.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                bgcolor: CARD_BG2, borderRadius: '14px', px: 2, py: 1.2,
                border: `1px solid ${BORDER}`, display: 'inline-block', maxWidth: '100%'
              }}
            >
              <Typography 
                component={RouterLink}
                to={authorId === (currentUser?.id ?? currentUser?.userId) ? '/profile' : `/profile/${authorId || ''}`}
                fontSize={14} 
                fontWeight={700} 
                color={TEXT_PRI} 
                sx={{ mb: 0.3, textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: PURPLE } }}
              >
                {author.fullName || 'Người dùng'}
              </Typography>
              <Typography fontSize={14} color={TEXT_PRI} sx={{ lineHeight: 1.5, wordBreak: 'break-word' }}>
                {comment.content}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 0.5, pl: 1 }}>
              <Typography fontSize={12} color={TEXT_SEC}>
                {formatDate(comment.createdAt)}
              </Typography>
              <Typography fontSize={12} fontWeight={600} color={TEXT_SEC} sx={{ cursor: 'pointer', '&:hover': { color: PURPLE } }}>
                Thích
              </Typography>
              <Typography 
                fontSize={12} 
                fontWeight={600} 
                color={TEXT_SEC} 
                sx={{ cursor: 'pointer', '&:hover': { color: PURPLE } }}
                onClick={() => {
                  setReplyingTo({ id: comment.id, name: author.fullName || 'Người dùng' });
                  document.getElementById('comment-input')?.focus();
                }}
              >
                Phản hồi
              </Typography>
            </Box>
          </Box>
        </Box>

        {comment.replies && comment.replies.length > 0 && (
          <Box sx={{ pl: 5, mt: 2, borderLeft: `1px solid ${BORDER}`, ml: 2 }}>
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Typography fontSize={16} fontWeight={700} color={TEXT_PRI} sx={{ mb: 2.5 }}>
        Bình luận {comments.length > 0 && `(${comments.length})`}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 3 }}>
        <Avatar
          src={fullImageUrl(currentUser?.avatarUrl)}
          sx={{ width: 38, height: 38, border: `1px solid ${BORDER}`, bgcolor: PURPLE }}
        >
          {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          id="comment-input"
          placeholder={replyingTo ? `Phản hồi ${replyingTo.name}...` : "Viết bình luận của bạn..."}
          variant="outlined"
          disabled={submitting}
          InputProps={{
            startAdornment: replyingTo && (
              <InputAdornment position="start">
                <Box 
                  sx={{ 
                    bgcolor: 'rgba(157, 110, 237, 0.1)', 
                    color: PURPLE, 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
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
                    bgcolor: text.trim() ? PURPLE : 'transparent',
                    color: text.trim() ? '#fff' : TEXT_SEC,
                    '&:hover': { bgcolor: text.trim() ? '#8a5bd6' : 'transparent' },
                    width: 32, height: 32
                  }}
                >
                  {submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: CARD_BG2, borderRadius: '18px', color: TEXT_PRI, padding: '10px 14px',
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: PURPLE },
              '&.Mui-focused fieldset': { borderColor: PURPLE },
              '&.Mui-disabled': { opacity: 0.7 }
            },
            '& input::placeholder': { color: TEXT_SEC, opacity: 1 },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ color: PURPLE }} />
        </Box>
      ) : comments.length === 0 ? (
        <Typography fontSize={13} color={TEXT_SEC} sx={{ mb: 2 }}>
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </Box>
      )}
    </Box>
  );
}
