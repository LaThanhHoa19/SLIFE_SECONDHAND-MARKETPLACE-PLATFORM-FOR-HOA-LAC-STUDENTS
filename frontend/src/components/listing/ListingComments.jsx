import { useState } from 'react';
import { Avatar, Box, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { fullImageUrl } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { Link as RouterLink } from 'react-router-dom';

export const CARD_BG2 = '#252230';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

const MOCK_COMMENTS = [
  {
    id: 1,
    content: "Bạn ơi cho mình hỏi máy còn bảo hành không ạ? Mình là sinh viên năm nhất đang cần tìm máy học viza.",
    userFullName: "Nguyễn Văn Đạt",
    userAvatar: "https://i.pravatar.cc/150?img=11",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    userId: 11,
    replies: [
      {
        id: 101,
        content: "Máy còn bảo hành 3 tháng chính hãng FPT nha bạn!",
        userFullName: "Người bán",
        userAvatar: "https://i.pravatar.cc/150?img=2",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        userId: 1,
        replies: []
      }
    ]
  },
  {
    id: 2,
    content: "Fix giá 500k mình lấy luôn trong ngày nhé, mình ở khu Dom E ngay gần đây.",
    userFullName: "Trần Mai Anh",
    userAvatar: "https://i.pravatar.cc/150?img=5",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userId: 5,
    replies: []
  }
];

export default function ListingComments({ listingId, currentUser }) {
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, name }

  const handleSubmit = () => {
    if (!text.trim()) return;
    
    const newComment = {
      id: Date.now(),
      content: text,
      userId: currentUser?.id,
      userFullName: currentUser?.fullName || 'Bạn',
      userAvatar: currentUser?.avatarUrl,
      createdAt: new Date().toISOString(),
      replies: []
    };

    if (replyingTo) {
      // Logic để chèn reply vào đúng parent (đệ quy)
      const addReply = (list) => {
        return list.map(c => {
          if (c.id === replyingTo.id) {
            return { ...c, replies: [...c.replies, newComment] };
          }
          if (c.replies.length > 0) {
            return { ...c, replies: addReply(c.replies) };
          }
          return c;
        });
      };
      setComments(addReply(comments));
      setReplyingTo(null);
    } else {
      setComments((prev) => [...prev, newComment]);
    }
    setText('');
  };

  const CommentItem = ({ comment, depth = 0 }) => (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar
          component={RouterLink}
          to={comment.userId === (currentUser?.id || currentUser?.user_id) ? '/profile' : `/profile/${comment.userId || comment.user_id || ''}`}
          src={fullImageUrl(comment.userAvatar)}
          sx={{ width: 36, height: 36, mt: 0.3, cursor: 'pointer', textDecoration: 'none', bgcolor: PURPLE }}
        >
          {comment.userFullName ? comment.userFullName.charAt(0).toUpperCase() : 'U'}
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
              to={comment.userId === (currentUser?.id || currentUser?.user_id) ? '/profile' : `/profile/${comment.userId || comment.user_id || ''}`}
              fontSize={14} 
              fontWeight={700} 
              color={TEXT_PRI} 
              sx={{ mb: 0.3, textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: PURPLE } }}
            >
              {comment.userFullName}
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
                setReplyingTo({ id: comment.id, name: comment.userFullName });
                // Focus vào input (optional but good UX)
                document.getElementById('comment-input')?.focus();
              }}
            >
              Phản hồi
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Render replies with indentation */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ pl: 5, mt: 2, borderLeft: `1px solid ${BORDER}`, ml: 2 }}>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Tiêu đề */}
      <Typography fontSize={16} fontWeight={700} color={TEXT_PRI} sx={{ mb: 2.5 }}>
        Bình luận ({comments.length})
      </Typography>

      {/* Input bình luận (đẩy lên trên để dễ tương tác hơn) */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 3 }}>
        <Avatar
          component={RouterLink}
          to={currentUser?.id === (currentUser?.id || currentUser?.user_id) ? '/profile' : `/profile/${currentUser?.id || currentUser?.user_id || ''}`}
          src={fullImageUrl(currentUser?.avatarUrl)}
          sx={{ width: 38, height: 38, border: `1px solid ${BORDER}`, cursor: 'pointer', textDecoration: 'none', bgcolor: PURPLE }}
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
                  disabled={!text.trim()}
                  sx={{
                    bgcolor: text.trim() ? PURPLE : 'transparent',
                    color: text.trim() ? '#fff' : TEXT_SEC,
                    '&:hover': { bgcolor: text.trim() ? '#8a5bd6' : 'transparent' },
                    width: 32, height: 32
                  }}
                >
                  <SendIcon sx={{ fontSize: 16 }} />
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
            },
            '& input::placeholder': { color: TEXT_SEC, opacity: 1 },
          }}
        />
      </Box>

      {/* Danh sách bình luận */}
      {comments.length === 0 ? (
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
