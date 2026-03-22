/**
 * Trang tin nhắn: danh sách hội thoại hoặc một cuộc hội thoại (sessionId từ URL).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import QuickreplyIcon from '@mui/icons-material/Quickreply';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_URL = `${API_BASE}/chat`;

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_URL   = `${API_BASE}/chat`;

// ── helpers ───────────────────────────────────────────────────────────────────

function getData(res) {
  const b = res?.data;
  return b?.data ?? b;
}

function makeTempId() {
  return `tmp_${Date.now()}_${Math.random()}`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function ImageBubble({ fileUrl }) {
  const src = fileUrl?.startsWith('http') ? fileUrl : `${API_BASE}${fileUrl}`;
  return (
    <Box
      component="img"
      src={src}
      alt="Ảnh"
      sx={{ maxWidth: 220, maxHeight: 220, borderRadius: 1, display: 'block', objectFit: 'cover', cursor: 'pointer' }}
      onClick={() => window.open(src, '_blank')}
    />
  );
}

function OfferBubble({ msg, onAccept, onReject }) {
  const isPending = msg.offerStatus === 'PENDING';
  const isMe = msg.isFromCurrentUser;
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} gutterBottom>
        {msg.content}
      </Typography>
      {!isMe && isPending && (
        <Stack direction="row" spacing={1} mt={0.5}>
          <Button size="small" variant="contained" color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => onAccept(msg.offerId)}>
            Chấp nhận
          </Button>
          <Button size="small" variant="outlined" color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => onReject(msg.offerId)}>
            Từ chối
          </Button>
        </Stack>
      )}
      {!isPending && (
        <Chip size="small"
              label={msg.offerStatus === 'ACCEPTED' ? '✅ Đã chấp nhận' : '❌ Đã từ chối'}
              color={msg.offerStatus === 'ACCEPTED' ? 'success' : 'error'}
              sx={{ mt: 0.5 }} />
      )}
    </Box>
  );
}

function Bubble({ msg, onAccept, onReject }) {
  const isMe     = msg.isFromCurrentUser === true;
  const isSystem = msg.messageType === 'DEAL_CONFIRMATION';
  const isPending = !!msg._pending;

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
        <Paper sx={{ px: 2, py: 1, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main', borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} color="success.contrastText">{msg.content}</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1, opacity: isPending ? 0.6 : 1 }}>
      <Paper elevation={1} sx={{
        maxWidth: '72%', p: 1.5,
        bgcolor: isMe ? 'primary.main' : 'grey.100',
        color: isMe ? 'primary.contrastText' : 'text.primary',
        borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
      }}>
        {!isMe && msg.senderName && (
          <Typography variant="caption" display="block" fontWeight={700} sx={{ mb: 0.5, opacity: 0.75 }}>
            {msg.senderName}
          </Typography>
        )}

        {msg.messageType === 'IMAGE'
          ? <ImageBubble fileUrl={msg.fileUrl} />
          : msg.messageType === 'OFFER_PROPOSAL'
            ? <OfferBubble msg={msg} onAccept={onAccept} onReject={onReject} />
            : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content}
              </Typography>
            )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, opacity: 0.65 }}>
          <Typography variant="caption">
            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '…'}
          </Typography>
          {isMe && (
            <Typography variant="caption">
              {isPending ? '⏳' : msg.isRead ? '✓✓' : '✓'}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default function ChatPage() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const currentUserId = currentUser?.id ?? currentUser?.user_id;

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(sessionIdFromUrl || null);
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionsVersion, setSessionsVersion] = useState(0);

  // Sync activeSessionId with URL param
  useEffect(() => {
    if (sessionIdFromUrl) setActiveSessionId(sessionIdFromUrl);
  }, [sessionIdFromUrl]);

  // Auto-open test session from localStorage if set (after test-chat-init)
  useEffect(() => {
    const id = localStorage.getItem('slife_test_session_id');
    if (id && !activeSessionId) {
      setActiveSessionId(id);
      localStorage.removeItem('slife_test_session_id');
      // Reload sessions list to include the new conversation
      setSessionsVersion((v) => v + 1);
    }
  }, [activeSessionId]);

  // Load + poll danh sách hội thoại (phát hiện conversation mới từ người dùng khác)
  const fetchSessions = useCallback(() => {
    return chatApi
      .getChats('ALL')
      .then((res) => {
        const body = res?.data;
        const list = Array.isArray(body?.data) ? body.data : Array.isArray(body?.content) ? body.content : Array.isArray(body) ? body : [];
        setSessions(list);
        return list;
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('[Chat] getChats failed:', err?.message ?? err);
        return [];
      });
  }, []);

  useEffect(() => {
    let ok = true;
    setSessionsLoading(true);
    fetchSessions().finally(() => { if (ok) setSessionsLoading(false); });
    return () => { ok = false; };
  }, [sessionsVersion, fetchSessions]);

  // Poll sessions mỗi 8 giây để tự động hiện conversation mới (từ Real User hoặc người khác)
  useEffect(() => {
    if (wsConnected) return;
    const id = setInterval(fetchSessions, 10000);
    return () => clearInterval(id);
  }, [wsConnected, fetchSessions]);

  // Load lịch sử khi chọn 1 session + polling để cả hai bên đều thấy tin mới
  const fetchHistory = useCallback(() => {
    if (!activeSessionId) return Promise.resolve();
    return chatApi.getHistory(activeSessionId, 0, 30).then(res => {
      const b = res?.data;
      const page = b?.data ?? b;
      const content = page?.content ?? (Array.isArray(page) ? page : []);
      setMessages(Array.isArray(content) ? [...content].reverse() : []);
    }).catch(() => setMessages([]));
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return; }
    let ok = true;
    setHistoryLoading(true);
    chatApi
      .getHistory(activeSessionId, 0, 30)
      .then((res) => {
        if (cancelled) return;
        const body = res?.data;
        const page = body?.data ?? body;
        const content = page?.content ?? (Array.isArray(page) ? page : []);
        const list = Array.isArray(content) ? [...content].reverse() : [];
        if (import.meta.env.DEV) {
          console.debug('[Chat] history', { sessionId: activeSessionId, count: list.length, hasContent: !!page?.content });
        }
        setMessages(list);
      })
      .catch((err) => {
        if (!cancelled) setMessages([]);
        if (import.meta.env.DEV) console.warn('[Chat] getHistory failed', err?.message ?? err);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeSessionId]);

  // Poll mỗi 3 giây khi đang mở một hội thoại để cả hai tài khoản đều thấy tin nhắn mới
  useEffect(() => {
    if (!activeSessionId) return;
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [activeSessionId, fetchHistory]);

  const handleSend = async () => {
    const text = (inputText || '').trim();
    if (!text || !activeSessionId || sending) return;
    setSending(true);
    setInputText('');
    try {
      await chatApi.sendMessage(activeSessionId, text);
      await fetchHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSessionId) return;
    setImageUploading(true);
    try {
      const res = await chatApi.uploadChatImage(activeSessionId, file);
      const url = getPayload(res);
      if (!url) return;
      // Send IMAGE message with the returned URL
      if (wsConnected && stompClientRef.current) {
        stompClientRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({ sessionId: activeSessionId, content: '[Hình ảnh]', messageType: 'IMAGE', fileUrl: url }),
        });
      } else {
        const msgRes = await chatApi.sendMessage(activeSessionId, '[Hình ảnh]', 'IMAGE', url);
        const msg = getPayload(msgRes);
        if (msg?.id) setMessages((prev) => [...prev, msg]);
      }
      fetchSessions();
    } catch (err) {
      console.error('[Chat] image upload failed', err);
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Typing ────────────────────────────────────────────────────────────────

  const sendTypingSignal = (isTyping) => {
    if (!wsConnected || !stompClientRef.current || !activeSessionId) return;
    stompClientRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ sessionId: activeSessionId, isTyping }),
    });
  };

  const stopTypingSignal = () => {
    if (typingSentRef.current) {
      sendTypingSignal(false);
      typingSentRef.current = false;
    }
    clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!typingSentRef.current) {
      sendTypingSignal(true);
      typingSentRef.current = true;
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingSignal(false);
      typingSentRef.current = false;
    }, 2500);
  };

  // ── Offer ─────────────────────────────────────────────────────────────────

  const handleMakeOffer = async () => {
    const amount = parseFloat(offerAmount.replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0 || !activeSessionId) return;
    setOfferDialogOpen(false);
    setOfferAmount('');
    try {
      const res = await chatApi.makeOffer(activeSessionId, amount);
      const msg = getPayload(res);
      if (msg?.id) setMessages((prev) => [...prev, msg]);
      fetchSessions();
    } catch (err) {
      console.error('[Chat] makeOffer failed', err?.response?.data?.message || err);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      const res = await chatApi.respondToOffer(offerId, 'ACCEPTED');
      const msg = getPayload(res);
      if (msg?.id) setMessages((prev) => [...prev, msg]);
      // Refresh to show SOLD status in session list
      fetchSessions();
      await fetchHistory();
    } catch (err) {
      console.error('[Chat] accept offer failed', err?.response?.data?.message || err);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      const res = await chatApi.respondToOffer(offerId, 'REJECTED');
      const msg = getPayload(res);
      setMessages((prev) =>
        prev.map((m) => (m.offerId === offerId ? { ...m, offerStatus: 'REJECTED' } : m))
      );
      if (msg?.id) setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err) {
      console.error('[Chat] reject offer failed', err?.response?.data?.message || err);
    }
  };

  // ── Image file selection → preview dialog ────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const MAX = 5 * 1024 * 1024;
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (file.size > MAX) { setUploadError('Ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.'); setPreviewOpen(true); return; }
    if (!ALLOWED.includes(file.type)) { setUploadError('Chỉ chấp nhận JPG, PNG, WebP.'); setPreviewOpen(true); return; }

    setPreviewSrc(URL.createObjectURL(file));
    setPreviewFile(file);
    setPreviewOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelPreview = () => {
    setPreviewOpen(false);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setPreviewFile(null);
    setUploadError('');
  };

  const confirmSendImage = async () => {
    if (!previewFile || !activeSessionId) return;
    setPreviewOpen(false);
    setImageUploading(true);

    // Optimistic image bubble
    const optimistic = {
      id: makeTempId(), _pending: true,
      sessionId: activeSessionId,
      senderId: currentUser?.id,
      senderName: currentUser?.fullName || 'Bạn',
      content: '[Hình ảnh]',
      messageType: 'IMAGE', fileUrl: previewSrc,
      timestamp: new Date().toISOString(),
      isRead: false, isFromCurrentUser: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      // 1. Upload to server
      const uploadRes = await chatApi.uploadChatImage(activeSessionId, previewFile);
      const fileUrl   = getData(uploadRes);
      if (!fileUrl) throw new Error('No URL returned from upload');

      // 2. Send IMAGE message via REST (always reliable, WS also picks it up)
      const msgRes = await chatApi.sendMessage(activeSessionId, '[Hình ảnh]', 'IMAGE', fileUrl);
      const msg    = getData(msgRes);

      setMessages(prev => {
        const cleaned = prev.filter(m => !m._pending);
        return msg?.id ? [...cleaned, msg] : cleaned;
      });
      fetchSessions();
    } catch (err) {
      setMessages(prev => prev.filter(m => !m._pending));
      const detail = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      alert(`Gửi ảnh thất bại: ${detail}`);
      console.error('[Chat] image send failed', err);
    } finally {
      setImageUploading(false);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      setPreviewSrc(null);
      setPreviewFile(null);
    }
  };

  // ── Typing ────────────────────────────────────────────────────────────────────

  const stopTyping = () => {
    clearTimeout(typingTimerRef.current);
    if (typingSentRef.current) {
      stompRef.current?.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ sessionId: activeSessionId, isTyping: false }),
      });
      typingSentRef.current = false;
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!wsConnected || !stompRef.current || !activeSessionId) return;
    if (!typingSentRef.current) {
      stompRef.current.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ sessionId: activeSessionId, isTyping: true }),
      });
      typingSentRef.current = true;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 2500);
  };

  // ── Offer ─────────────────────────────────────────────────────────────────────

  const submitOffer = async () => {
    const amount = parseFloat(String(offerAmount).replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0 || !activeSessionId) return;
    setOfferOpen(false);
    setOfferAmount('');
    try {
      const res = await chatApi.makeOffer(activeSessionId, amount);
      const msg = getData(res);
      if (msg?.id) setMessages(prev => [...prev, msg]);
      fetchSessions();
    } catch (err) {
      const detail = err?.response?.data?.message || 'Lỗi không xác định';
      alert(`Đề xuất thất bại: ${detail}`);
    }
  };

  const handleAccept = async (offerId) => {
    try {
      const res = await chatApi.respondToOffer(offerId, 'ACCEPTED');
      const msg = getData(res);
      setMessages(prev => {
        const updated = prev.map(m => m.offerId === offerId ? { ...m, offerStatus: 'ACCEPTED' } : m);
        return msg?.id && !updated.some(m => m.id === msg.id) ? [...updated, msg] : updated;
      });
      await fetchHistory();
      fetchSessions();
    } catch (err) { alert(err?.response?.data?.message || 'Lỗi'); }
  };

  const handleReject = async (offerId) => {
    try {
      await chatApi.respondToOffer(offerId, 'REJECTED');
      setMessages(prev => prev.map(m => m.offerId === offerId ? { ...m, offerStatus: 'REJECTED' } : m));
    } catch (err) { alert(err?.response?.data?.message || 'Lỗi'); }
  };

  const activeSession = sessions.find(s => s.sessionId === activeSessionId);
  const otherParticipantId = activeSession ? (activeSession.buyerId === currentUserId ? activeSession.sellerId : activeSession.buyerId) : null;

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', maxWidth: 1000, mx: 'auto', pt: 2 }}>
      <Paper sx={{ width: 280, mr: 2, overflow: 'auto', flexShrink: 0 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2, pb: 0 }}>
          Tin nhắn
        </Typography>
        {sessionsLoading ? (
          <Box sx={{ p: 2 }}><CircularProgress size={24} /></Box>
        ) : (
          <List dense sx={{ flex: 1, overflow: 'auto' }}>
            {sessions.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                Chưa có hội thoại. Vào tin đăng và bấm &quot;Nhắn tin&quot; để bắt đầu.
              </Typography>
            )}
            {sessions.map((s) => (
              <ListItemButton
                key={s.sessionId}
                selected={s.sessionId === activeSessionId}
                onClick={() => setActiveSessionId(s.sessionId)}
              >
                <ListItemText
                  primary={s.otherParticipantName || s.listingTitle || 'Chat'}
                  secondary={s.lastMessagePreview || s.listingTitle}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!activeSessionId ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            Chọn một hội thoại bên trái hoặc mở tin đăng và bấm &quot;Nhắn tin&quot;.
          </Box>
        ) : (
          <>
            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography 
                component={RouterLink}
                to={otherParticipantId ? `/profile/${otherParticipantId}` : '#'}
                variant="subtitle1" 
                fontWeight={600}
                sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { textDecoration: 'underline', color: 'primary.main' } }}
              >
                {activeSession?.otherParticipantName || activeSession?.listingTitle || 'Chat'}
              </Typography>
              {activeSession?.listingTitle && (
                <Typography variant="caption" color="text.secondary">
                  {activeSession.listingTitle}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {historyLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                messages.map((m) => {
                  const isMe = m.isFromCurrentUser === true || (currentUserId != null && m.senderId === currentUserId);
                  return (
                  <Box
                    key={m.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Paper
                      sx={{
                        maxWidth: '75%',
                        p: 1.5,
                        bgcolor: isMe ? 'primary.main' : 'grey.100',
                        color: isMe ? 'primary.contrastText' : 'text.primary',
                      }}
                    >
                      {!isMe && m.senderName && (
                        <Typography 
                          component={RouterLink}
                          to={m.senderId ? `/profile/${m.senderId}` : '#'}
                          variant="caption" 
                          display="block" 
                          color="text.secondary" 
                          sx={{ mb: 0.5, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: 'primary.main' } }}
                        >
                          {m.senderName}
                        </Typography>
                      )}
                      <Typography variant="body2">{m.content}</Typography>
                      {m.timestamp && (
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                          {new Date(m.timestamp).toLocaleString('vi-VN')}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                  );
                })
              )}
            </Box>
            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              />
              <IconButton color="primary" onClick={handleSend} disabled={sending || !inputText?.trim()}>
                {sending ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
