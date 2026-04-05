import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
} from '@mui/material';

const PAPER_SX = {
  bgcolor: '#242526',
  backgroundImage: 'none',
  borderRadius: 3,
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 24px 48px rgba(0,0,0,0.55)',
};

/**
 * Xác nhận chặn — giải thích rõ hệ quả hai chiều (giống các mạng xã hội lớn).
 */
export default function BlockUserConfirmDialog({ open, onClose, displayName, onConfirm }) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      /* lỗi đã toast ở caller */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: PAPER_SX }}>
      <DialogTitle sx={{ color: '#fff', fontWeight: 700, pt: 2.5 }}>
        Chặn {displayName ? `“${displayName}”` : 'người dùng này'}?
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
          Hai bên sẽ <strong style={{ color: '#e9d5ff' }}>không còn xem được hồ sơ, tin đăng và tin nhắn</strong> của nhau.
          Các tương tác (bình luận, trả giá, v.v.) cũng sẽ bị chặn. Bạn có thể bỏ chặn sau trong mục{' '}
          <strong style={{ color: '#e9d5ff' }}>Đã chặn</strong> (menu bên trái).
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={busy} sx={{ color: 'rgba(255,255,255,0.65)', textTransform: 'none' }}>
          Hủy
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={busy}
          onClick={handleConfirm}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {busy ? <CircularProgress size={22} color="inherit" /> : 'Chặn'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
