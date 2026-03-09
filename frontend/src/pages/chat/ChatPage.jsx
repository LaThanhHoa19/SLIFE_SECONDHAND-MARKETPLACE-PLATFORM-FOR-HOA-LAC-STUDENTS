/**
 * ChatPage – FE-05
 * Real-time chat: WebSocket (STOMP/SockJS), text, image upload, offer negotiation,
 * typing indicator, read receipts, quick replies.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';

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

// ── main page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const token = localStorage.getItem('slife_access_token');

  const [sessions, setSessions]         = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(sessionIdFromUrl || null);

  const [messages, setMessages]         = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [inputText, setInputText]       = useState('');
  const [sending, setSending]           = useState(false);

  const [quickReplies, setQuickReplies] = useState([]);
  const [showQR, setShowQR]             = useState(false);

  // Offer dialog
  const [offerOpen, setOfferOpen]       = useState(false);
  const [offerAmount, setOfferAmount]   = useState('');

  // Image preview dialog
  const [previewSrc, setPreviewSrc]     = useState(null);   // object URL
  const [previewFile, setPreviewFile]   = useState(null);   // File
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError]   = useState('');
  const fileInputRef = useRef(null);

  // WebSocket
  const stompRef  = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Typing
  const [typingUser, setTypingUser]     = useState(null);
  const typingTimerRef  = useRef(null);
  const typingSentRef   = useRef(false);
  const typingOutRef    = useRef(null);

  const bottomRef = useRef(null);
  const [sessionsVersion, setSessionsVersion] = useState(0);

  // ── URL sync ────────────────────────────────────────────────────────────────

  useEffect(() => { if (sessionIdFromUrl) setActiveSessionId(sessionIdFromUrl); }, [sessionIdFromUrl]);

  useEffect(() => {
    const id = localStorage.getItem('slife_test_session_id');
    if (id && !activeSessionId) {
      setActiveSessionId(id);
      localStorage.removeItem('slife_test_session_id');
      setSessionsVersion(v => v + 1);
    }
  }, [activeSessionId]);

  // ── WebSocket ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    const client = new StompClient({
      webSocketFactory: () => new SockJS(`${WS_URL}?token=${token}`),
      reconnectDelay: 5000,
      onConnect:    () => setWsConnected(true),
      onDisconnect: () => setWsConnected(false),
      onStompError: (f) => { if (import.meta.env.DEV) console.warn('[WS]', f); },
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); stompRef.current = null; setWsConnected(false); };
  }, [token]);

  useEffect(() => {
    const client = stompRef.current;
    if (!client || !wsConnected || !activeSessionId) return;

    // Topic: room broadcasts (messages, typing, read events)
    const topicSub = client.subscribe(`/topic/chat.${activeSessionId}`, frame => {
      try {
        const payload = JSON.parse(frame.body);

        if (payload.event === 'TYPING') {
          if (payload.senderEmail !== currentUser?.email) {
            setTypingUser(payload.isTyping ? payload.senderEmail : null);
            if (payload.isTyping) {
              clearTimeout(typingOutRef.current);
              typingOutRef.current = setTimeout(() => setTypingUser(null), 3500);
            }
          }
          return;
        }

        if (payload.event === 'READ') {
          setMessages(prev => prev.map(m => m.isFromCurrentUser ? { ...m, isRead: true } : m));
          return;
        }

        // Confirmed message from server — replace optimistic or append
        if (payload.id) {
          setMessages(prev => {
            const withoutPending = prev.filter(m => !m._pending);
            if (withoutPending.some(m => m.id === payload.id)) return prev.filter(m => !m._pending);
            return [...withoutPending, payload];
          });
          chatApi.markSessionRead(activeSessionId).catch(() => {});
        }
      } catch { /* ignore */ }
    });

    // Private queue: messages pushed to this user by server
    const queueSub = client.subscribe('/user/queue/messages', frame => {
      try {
        const msg = JSON.parse(frame.body);
        if (msg?.sessionId === activeSessionId && msg.id) {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
        fetchSessions();
      } catch { /* ignore */ }
    });

    return () => { topicSub.unsubscribe(); queueSub.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsConnected, activeSessionId]);

  // ── Sessions ─────────────────────────────────────────────────────────────────

  const fetchSessions = useCallback(() =>
    chatApi.getChats('ALL').then(res => {
      const b = res?.data;
      const list = Array.isArray(b?.data) ? b.data
                 : Array.isArray(b?.content) ? b.content
                 : Array.isArray(b) ? b : [];
      setSessions(list);
    }).catch(() => {}), []);

  useEffect(() => {
    let ok = true;
    setSessionsLoading(true);
    fetchSessions().finally(() => { if (ok) setSessionsLoading(false); });
    return () => { ok = false; };
  }, [sessionsVersion, fetchSessions]);

  useEffect(() => {
    if (wsConnected) return;
    const id = setInterval(fetchSessions, 10000);
    return () => clearInterval(id);
  }, [wsConnected, fetchSessions]);

  // ── History ───────────────────────────────────────────────────────────────────

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
    fetchHistory().finally(() => { if (ok) setHistoryLoading(false); });
    chatApi.markSessionRead(activeSessionId).catch(() => {});
    return () => { ok = false; };
  }, [activeSessionId, fetchHistory]);

  useEffect(() => {
    if (wsConnected || !activeSessionId) return;
    const id = setInterval(fetchHistory, 4000);
    return () => clearInterval(id);
  }, [wsConnected, activeSessionId, fetchHistory]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Quick replies ─────────────────────────────────────────────────────────────

  useEffect(() => {
    chatApi.getQuickReplies().then(res => {
      const list = getData(res);
      if (Array.isArray(list)) setQuickReplies(list);
    }).catch(() => {});
  }, []);

  // ── Send text ─────────────────────────────────────────────────────────────────

  const doSend = async (text) => {
    if (!text?.trim() || !activeSessionId || sending) return;
    setSending(true);
    setInputText('');
    setShowQR(false);
    stopTyping();

    const optimistic = {
      id: makeTempId(), _pending: true,
      sessionId: activeSessionId,
      senderId: currentUser?.id,
      senderName: currentUser?.fullName || 'Bạn',
      content: text.trim(),
      messageType: 'TEXT', fileUrl: null,
      timestamp: new Date().toISOString(),
      isRead: false, isFromCurrentUser: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      if (wsConnected && stompRef.current) {
        stompRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({ sessionId: activeSessionId, content: text.trim(), messageType: 'TEXT' }),
        });
        // Server will echo back via /topic/chat.{id} → optimistic replaced there
      } else {
        const res = await chatApi.sendMessage(activeSessionId, text.trim());
        const msg = getData(res);
        setMessages(prev => {
          const cleaned = prev.filter(m => !m._pending);
          return msg?.id ? [...cleaned, msg] : cleaned;
        });
        fetchSessions();
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => !m._pending));
      console.error('[Chat] send failed', e);
    } finally {
      setSending(false);
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

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', maxWidth: 1100, mx: 'auto', pt: 2, gap: 2 }}>

      {/* Session list */}
      <Paper sx={{ width: 280, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} flex={1}>Tin nhắn</Typography>
          <Tooltip title={wsConnected ? 'Đang kết nối' : 'Đang ngắt kết nối'}>
            <Badge variant="dot" color={wsConnected ? 'success' : 'error'}
                   sx={{ '& .MuiBadge-dot': { width: 10, height: 10 } }}>
              <Box />
            </Badge>
          </Tooltip>
        </Box>

        {sessionsLoading ? (
          <Box sx={{ p: 2 }}><CircularProgress size={24} /></Box>
        ) : (
          <List dense sx={{ flex: 1, overflow: 'auto' }}>
            {sessions.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
                Chưa có hội thoại. Mở tin đăng và bấm &quot;Nhắn tin&quot;.
              </Typography>
            )}
            {sessions.map(s => (
              <ListItemButton key={s.sessionId} selected={s.sessionId === activeSessionId}
                              onClick={() => setActiveSessionId(s.sessionId)}
                              sx={{ borderRadius: 1, mx: 0.5, mb: 0.25 }}>
                <Avatar sx={{ width: 36, height: 36, mr: 1.5, bgcolor: 'primary.light', fontSize: 14 }}>
                  {(s.otherParticipantName || 'C').charAt(0).toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={s.otherParticipantName || s.listingTitle || 'Chat'}
                  secondary={s.lastMessagePreview || s.listingTitle}
                  primaryTypographyProps={{ noWrap: true, fontWeight: 600, fontSize: 14 }}
                  secondaryTypographyProps={{ noWrap: true, fontSize: 12 }} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      {/* Message area */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {!activeSessionId ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <Typography>Chọn một hội thoại hoặc mở tin đăng và bấm &quot;Nhắn tin&quot;.</Typography>
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                {(activeSession?.otherParticipantName || 'C').charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                  {activeSession?.otherParticipantName || activeSession?.listingTitle || 'Chat'}
                </Typography>
                {activeSession?.listingTitle && (
                  <Typography variant="caption" color="text.secondary">📦 {activeSession.listingTitle}</Typography>
                )}
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1.5 }}>
              {historyLoading ? (
                <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
              ) : (
                messages.map(m => (
                  <Bubble key={m.id} msg={m} onAccept={handleAccept} onReject={handleReject} />
                ))
              )}
              {typingUser && (
                <Box sx={{ color: 'text.secondary', mb: 1 }}>
                  <Typography variant="caption" fontStyle="italic">Đang nhập…</Typography>
                </Box>
              )}
              <div ref={bottomRef} />
            </Box>

            {/* Quick replies */}
            {showQR && quickReplies.length > 0 && (
              <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {quickReplies.map((qr, i) => (
                  <Chip key={i} label={qr} size="small" clickable variant="outlined"
                        onClick={() => doSend(qr)} />
                ))}
              </Box>
            )}

            <Divider />

            {/* Input bar */}
            <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
              <Tooltip title="Câu trả lời nhanh">
                <IconButton size="small" color={showQR ? 'primary' : 'default'} onClick={() => setShowQR(v => !v)}>
                  <QuickreplyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Gửi ảnh (JPG/PNG/WebP · tối đa 5 MB)">
                <span>
                  <IconButton size="small" onClick={() => fileInputRef.current?.click()}
                              disabled={imageUploading}>
                    {imageUploading ? <CircularProgress size={18} /> : <AttachFileIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                     style={{ display: 'none' }} onChange={handleFileChange} />

              <Tooltip title="Trả giá">
                <IconButton size="small" onClick={() => setOfferOpen(true)}>
                  <MonetizationOnIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <TextField size="small" fullWidth multiline maxRows={4}
                         placeholder="Nhập tin nhắn…"
                         value={inputText}
                         onChange={handleInputChange}
                         onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(inputText); } }}
                         sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />

              <IconButton color="primary" onClick={() => doSend(inputText)}
                          disabled={sending || !inputText?.trim()} sx={{ flexShrink: 0 }}>
                {sending ? <CircularProgress size={22} /> : <SendIcon />}
              </IconButton>
            </Box>
          </>
        )}
      </Paper>

      {/* ── Image preview dialog ── */}
      <Dialog open={previewOpen} onClose={cancelPreview} maxWidth="sm" fullWidth>
        <DialogTitle>Xem trước ảnh</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {uploadError ? (
            <Typography color="error">{uploadError}</Typography>
          ) : previewSrc ? (
            <Box component="img" src={previewSrc} alt="preview"
                 sx={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 1 }} />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelPreview}>Huỷ</Button>
          {!uploadError && (
            <Button variant="contained" onClick={confirmSendImage} disabled={imageUploading}>
              {imageUploading ? <CircularProgress size={20} /> : 'Gửi ảnh'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Offer dialog ── */}
      <Dialog open={offerOpen} onClose={() => setOfferOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>💰 Đề xuất giá</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Giá đề xuất (VND)" type="number"
                     value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                     inputProps={{ min: 1 }} sx={{ mt: 1 }} />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Tối đa 5 lần đề xuất mỗi sản phẩm (BR-35).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferOpen(false)}>Huỷ</Button>
          <Button variant="contained" onClick={submitOffer} disabled={!offerAmount}>
            Gửi đề xuất
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
