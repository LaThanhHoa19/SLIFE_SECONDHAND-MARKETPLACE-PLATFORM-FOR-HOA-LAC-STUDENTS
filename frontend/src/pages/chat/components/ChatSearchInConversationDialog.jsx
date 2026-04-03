import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import * as chatApi from '../../../api/chatApi';
import { SearchHighlight } from '../chatSearchHighlight';

function previewMessageContent(msg) {
  if (!msg) return '';
  if (msg.messageType === 'IMAGE') return '[Ảnh]';
  if (msg.messageType === 'OFFER_PROPOSAL') return msg.content || '[Trả giá]';
  return typeof msg.content === 'string' ? msg.content : '';
}

export default function ChatSearchInConversationDialog({
  open,
  onClose,
  sessionId,
  onPickMessage,
}) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const pageRef = useRef(0);
  const totalRef = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 320);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) {
      setQ('');
      setDebounced('');
      setRows([]);
      pageRef.current = 0;
      totalRef.current = 0;
      setTotalElements(0);
      setError('');
      return;
    }
    if (!sessionId || debounced.length < 2) {
      setRows([]);
      setTotalElements(0);
      totalRef.current = 0;
      setError('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await chatApi.searchChatMessages(sessionId, debounced, 0, 20);
        const body = res?.data;
        const pageData = body?.data ?? body;
        const content = Array.isArray(pageData?.content) ? pageData.content : [];
        const total = typeof pageData?.totalElements === 'number' ? pageData.totalElements : content.length;
        if (cancelled) return;
        setRows(content);
        pageRef.current = 0;
        setTotalElements(total);
        totalRef.current = total;
      } catch (e) {
        if (cancelled) return;
        const msg =
            e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Không tìm được';
        setError(String(msg));
        setRows([]);
        setTotalElements(0);
        totalRef.current = 0;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sessionId, debounced]);

  const handleLoadMore = async () => {
    if (!sessionId || debounced.length < 2 || loading) return;
    const nextPage = pageRef.current + 1;
    const loaded = rows.length;
    if (loaded >= totalRef.current) return;

    setLoading(true);
    setError('');
    try {
      const res = await chatApi.searchChatMessages(sessionId, debounced, nextPage, 20);
      const body = res?.data;
      const pageData = body?.data ?? body;
      const content = Array.isArray(pageData?.content) ? pageData.content : [];
      const total = typeof pageData?.totalElements === 'number' ? pageData.totalElements : totalRef.current;
      totalRef.current = total;
      setTotalElements(total);
      setRows((prev) => [...prev, ...content]);
      pageRef.current = nextPage;
    } catch (e) {
      const msg =
          e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Không tải thêm được';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const hasMore = rows.length < totalElements;
  const hint = debounced.length > 0 && debounced.length < 2 ? 'Nhập ít nhất 2 ký tự.' : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        <Typography component="span" variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
          Tìm trong cuộc trò chuyện
        </Typography>
        <IconButton aria-label="Đóng" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 1.5, minHeight: 320 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Từ khóa trong tin nhắn…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {hint}
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        {loading && rows.length === 0 && debounced.length >= 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {!loading && debounced.length >= 2 && rows.length === 0 && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            Không có tin nhắn khớp.
          </Typography>
        )}
        {rows.length > 0 && (
          <>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5, mb: 0.5 }}>
              {totalElements} kết quả — bấm để xem trong đoạn chat
            </Typography>
            <List dense disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
              {rows.map((msg) => {
                const id = msg?.id;
                const preview = previewMessageContent(msg);
                const time =
                    msg?.timestamp &&
                    new Date(msg.timestamp).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                return (
                  <ListItemButton
                    key={id ?? `${preview}-${time}`}
                    alignItems="flex-start"
                    onClick={() => {
                      if (id != null) onPickMessage?.(id, debounced);
                    }}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="caption" color="text.secondary" component="span">
                          {msg?.senderName || 'Người dùng'}
                          {time ? ` · ${time}` : ''}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <SearchHighlight
                            text={preview || ' '}
                            query={debounced}
                            component="div"
                            sx={{
                              fontSize: '0.875rem',
                              lineHeight: 1.45,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                            }}
                          />
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                <Button size="small" onClick={handleLoadMore} disabled={loading}>
                  {loading ? 'Đang tải…' : 'Tải thêm'}
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
