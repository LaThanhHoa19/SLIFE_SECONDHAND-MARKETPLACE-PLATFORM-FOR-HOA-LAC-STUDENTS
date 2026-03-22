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
    userId: 11
  },
  {
    id: 2,
    content: "Fix giá 500k mình lấy luôn trong ngày nhé, mình ở khu Dom E ngay gần đây.",
    userFullName: "Trần Mai Anh",
    userAvatar: "https://i.pravatar.cc/150?img=5",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userId: 5
  },
  {
    id: 3,
    content: "Sản phẩm chất quá, tiếc là mình vừa mua cái khác rồi hic. Up bài cho bạn mau bay nhé!",
    userFullName: "Lê Quốc Bảo",
    userAvatar: "https://i.pravatar.cc/150?img=60",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    userId: 60
  }
];

export default function ListingComments({ listingId, currentUser }) {
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [text, setText] = useState('');

  // Placeholder – thực tế sẽ gọi commentApi khi backend sẵn sàng
  const handleSubmit = () => {
    if (!text.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        content: text,
        userId: currentUser?.id,
        userFullName: currentUser?.fullName || 'Bạn',
        userAvatar: currentUser?.avatarUrl,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText('');
  };

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
          to={(currentUser?.id || currentUser?.user_id) ? `/profile/${currentUser.id || currentUser.user_id}` : '#'}
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
          placeholder="Viết bình luận của bạn..."
          variant="outlined"
          InputProps={{
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 1 }}>
          {comments.map((c) => (
            <Box key={c.id} sx={{ display: 'flex', gap: 1.5 }}>
              <Avatar
                component={RouterLink}
                to={(c.userId || c.user_id) ? `/profile/${c.userId || c.user_id}` : '#'}
                src={fullImageUrl(c.userAvatar)}
                sx={{ width: 36, height: 36, mt: 0.3, cursor: 'pointer', textDecoration: 'none', bgcolor: PURPLE }}
              >
                {c.userFullName ? c.userFullName.charAt(0).toUpperCase() : 'U'}
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
                    to={(c.userId || c.user_id) ? `/profile/${c.userId || c.user_id}` : '#'}
                    fontSize={14} 
                    fontWeight={700} 
                    color={TEXT_PRI} 
                    sx={{ mb: 0.3, textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: PURPLE } }}
                  >
                    {c.userFullName}
                  </Typography>
                  <Typography fontSize={14} color={TEXT_PRI} sx={{ lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {c.content}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 0.5, pl: 1 }}>
                  <Typography fontSize={12} color={TEXT_SEC}>
                    {formatDate(c.createdAt)}
                  </Typography>
                  <Typography fontSize={12} fontWeight={600} color={TEXT_SEC} sx={{ cursor: 'pointer', '&:hover': { color: PURPLE } }}>
                    Thích
                  </Typography>
                  <Typography fontSize={12} fontWeight={600} color={TEXT_SEC} sx={{ cursor: 'pointer', '&:hover': { color: PURPLE } }}>
                    Phản hồi
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
