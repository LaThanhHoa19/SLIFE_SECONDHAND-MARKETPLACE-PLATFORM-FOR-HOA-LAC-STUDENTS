/**
 * ChatPage – FE-05
 * Real-time chat with WebSocket (STOMP/SockJS), multimedia, negotiation, typing indicator, read receipts.
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
import ImageIcon from '@mui/icons-material/Image';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_URL = `${API_BASE}/chat`;

function getPayload(res) {
  const body = res?.data;
  return body?.data ?? body;
}

// ── Message type renderers ────────────────────────────────────────────────────

function ImageMessage({ fileUrl }) {
  const src = fileUrl?.startsWith('http') ? fileUrl : `${API_BASE}${fileUrl}`;
  return (
    <Box
      component="img"
      src={src}
      alt="Hình ảnh"
      sx={{ maxWidth: 220, maxHeight: 220, borderRadius: 1, display: 'block', objectFit: 'cover' }}
    />
  );
}

function OfferMessage({ message, currentUserId, onAccept, onReject }) {
  const isSender = message.isFromCurrentUser;
  const isPending = message.offerStatus === 'PENDING';
  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        {message.content}
      </Typography>
      {!isSender && isPending && (
        <Stack direction="row" spacing={1} mt={0.5}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => onAccept(message.offerId)}
          >
            Chấp nhận
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => onReject(message.offerId)}
          >
            Từ chối
          </Button>
        </Stack>
      )}
      {!isPending && (
        <Chip
          size="small"
          label={message.offerStatus === 'ACCEPTED' ? '✅ Đã chấp nhận' : '❌ Đã từ chối'}
          color={message.offerStatus === 'ACCEPTED' ? 'success' : 'error'}
          sx={{ mt: 0.5 }}
        />
      )}
    </Box>
  );
}

function DealMessage({ content }) {
  return (
    <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1, border: '1px solid', borderColor: 'success.main' }}>
      <Typography variant="body2" fontWeight={600} color="success.contrastText">
        {content}
      </Typography>
    </Box>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, currentUserId, onAccept, onReject }) {
  const isMe = message.isFromCurrentUser === true;
  const isSystem = message.messageType === 'DEAL_CONFIRMATION';

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
        <DealMessage content={message.content} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1 }}>
      <Paper
        elevation={1}
        sx={{
          maxWidth: '72%',
          p: 1.5,
          bgcolor: isMe ? 'primary.main' : 'grey.100',
          color: isMe ? 'primary.contrastText' : 'text.primary',
          borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        }}
      >
        {!isMe && message.senderName && (
          <Typography variant="caption" display="block" fontWeight={600} sx={{ mb: 0.5, opacity: 0.8 }}>
            {message.senderName}
          </Typography>
        )}

        {message.messageType === 'IMAGE' ? (
          <ImageMessage fileUrl={message.fileUrl} />
        ) : message.messageType === 'OFFER_PROPOSAL' ? (
          <OfferMessage
            message={message}
            currentUserId={currentUserId}
            onAccept={onAccept}
            onReject={onReject}
          />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, opacity: 0.7 }}>
          <Typography variant="caption">
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Typography>
          {isMe && (
            <Typography variant="caption">
              {message.isRead ? '✓✓' : '✓'}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const currentUserId = currentUser?.id ?? currentUser?.user_id;
  const token = localStorage.getItem('slife_access_token');

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(sessionIdFromUrl || null);

  // Messages
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Input
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Quick replies
  const [quickReplies, setQuickReplies] = useState([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Offer dialog
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  // Image upload
  const fileInputRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);

  // WebSocket
  const stompClientRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Typing
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);

  // Scroll
  const messagesEndRef = useRef(null);
  const [sessionsVersion, setSessionsVersion] = useState(0);

  // Sync URL param
  useEffect(() => {
    if (sessionIdFromUrl) setActiveSessionId(sessionIdFromUrl);
  }, [sessionIdFromUrl]);

  // Auto-open test session from localStorage
  useEffect(() => {
    const testSessionId = localStorage.getItem('slife_test_session_id');
    if (testSessionId && !activeSessionId) {
      setActiveSessionId(testSessionId);
      localStorage.removeItem('slife_test_session_id');
      setSessionsVersion((v) => v + 1);
    }
  }, [activeSessionId]);

  // ── WebSocket ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    const client = new StompClient({
      webSocketFactory: () => new SockJS(`${WS_URL}?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true);
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: (frame) => {
        if (import.meta.env.DEV) console.warn('[WS] STOMP error', frame);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
      setWsConnected(false);
    };
  }, [token]);

  // Subscribe to session-specific topic when active session changes
  useEffect(() => {
    const client = stompClientRef.current;
    if (!client || !wsConnected || !activeSessionId) return;

    const msgSub = client.subscribe(`/topic/chat.${activeSessionId}`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);

        if (payload.event === 'TYPING') {
          if (payload.senderEmail !== currentUser?.email) {
            setTypingUser(payload.isTyping ? payload.senderEmail : null);
            if (payload.isTyping) {
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3500);
            }
          }
          return;
        }

        if (payload.event === 'READ') {
          setMessages((prev) =>
            prev.map((m) => (!m.isFromCurrentUser ? { ...m, isRead: true } : m))
          );
          return;
        }

        // Regular ChatMessageResponse — append if new
        if (payload.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
          // Auto-mark as read since this window is open
          chatApi.markSessionRead(activeSessionId).catch(() => {});
        }
      } catch {
        // ignore parse errors
      }
    });

    // Subscribe to private messages (sent by NotificationService)
    const privateSub = client.subscribe('/user/queue/messages', (frame) => {
      try {
        const msg = JSON.parse(frame.body);
        if (msg?.sessionId === activeSessionId && msg.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        // Refresh sessions list to update last-message preview
        fetchSessions();
      } catch {
        // ignore
      }
    });

    return () => {
      msgSub.unsubscribe();
      privateSub.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsConnected, activeSessionId]);

  // ── Sessions list ─────────────────────────────────────────────────────────

  const fetchSessions = useCallback(() => {
    return chatApi
      .getChats('ALL')
      .then((res) => {
        const body = res?.data;
        const list = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body?.content)
          ? body.content
          : Array.isArray(body)
          ? body
          : [];
        setSessions(list);
        return list;
      })
      .catch(() => []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSessionsLoading(true);
    fetchSessions().finally(() => {
      if (!cancelled) setSessionsLoading(false);
    });
    return () => { cancelled = true; };
  }, [sessionsVersion, fetchSessions]);

  // Fallback poll (when WS unavailable) — less aggressive than before
  useEffect(() => {
    if (wsConnected) return;
    const id = setInterval(fetchSessions, 10000);
    return () => clearInterval(id);
  }, [wsConnected, fetchSessions]);

  // ── Message history ───────────────────────────────────────────────────────

  const fetchHistory = useCallback(() => {
    if (!activeSessionId) return Promise.resolve();
    return chatApi
      .getHistory(activeSessionId, 0, 30)
      .then((res) => {
        const body = res?.data;
        const page = body?.data ?? body;
        const content = page?.content ?? (Array.isArray(page) ? page : []);
        setMessages(Array.isArray(content) ? [...content].reverse() : []);
      })
      .catch(() => setMessages([]));
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    fetchHistory().finally(() => {
      if (!cancelled) setHistoryLoading(false);
    });
    // Mark as read when opening session
    chatApi.markSessionRead(activeSessionId).catch(() => {});
    return () => { cancelled = true; };
  }, [activeSessionId, fetchHistory]);

  // Fallback poll for messages when WS unavailable
  useEffect(() => {
    if (wsConnected || !activeSessionId) return;
    const id = setInterval(fetchHistory, 4000);
    return () => clearInterval(id);
  }, [wsConnected, activeSessionId, fetchHistory]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Quick replies ─────────────────────────────────────────────────────────

  useEffect(() => {
    chatApi.getQuickReplies().then((res) => {
      const list = getPayload(res);
      if (Array.isArray(list)) setQuickReplies(list);
    }).catch(() => {});
  }, []);

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || !activeSessionId || sending) return;
    setSending(true);
    setInputText('');
    setShowQuickReplies(false);
    stopTypingSignal();

    try {
      if (wsConnected && stompClientRef.current) {
        stompClientRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({ sessionId: activeSessionId, content: text, messageType: 'TEXT' }),
        });
        // Optimistic update will be merged when WS echo arrives
      } else {
        const res = await chatApi.sendMessage(activeSessionId, text);
        const msg = getPayload(res);
        if (msg?.id) setMessages((prev) => [...prev, msg]);
      }
      fetchSessions();
    } catch (e) {
      console.error('[Chat] send failed', e);
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

  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', maxWidth: 1100, mx: 'auto', pt: 2, gap: 2 }}>
      {/* ── Session list panel ── */}
      <Paper sx={{ width: 280, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} flex={1}>
            Tin nhắn
          </Typography>
          <Badge
            variant="dot"
            color={wsConnected ? 'success' : 'error'}
            sx={{ '& .MuiBadge-dot': { width: 10, height: 10 } }}
          >
            <Box />
          </Badge>
        </Box>

        {sessionsLoading ? (
          <Box sx={{ p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense sx={{ flex: 1, overflow: 'auto' }}>
            {sessions.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
                Chưa có hội thoại. Vào tin đăng và bấm &quot;Nhắn tin&quot; để bắt đầu.
              </Typography>
            )}
            {sessions.map((s) => (
              <ListItemButton
                key={s.sessionId}
                selected={s.sessionId === activeSessionId}
                onClick={() => setActiveSessionId(s.sessionId)}
                sx={{ borderRadius: 1, mx: 0.5, mb: 0.25 }}
              >
                <Avatar sx={{ width: 36, height: 36, mr: 1.5, bgcolor: 'primary.light', fontSize: 14 }}>
                  {(s.otherParticipantName || 'C').charAt(0).toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={s.otherParticipantName || s.listingTitle || 'Chat'}
                  secondary={s.lastMessagePreview || s.listingTitle}
                  primaryTypographyProps={{ noWrap: true, fontWeight: 600, fontSize: 14 }}
                  secondaryTypographyProps={{ noWrap: true, fontSize: 12 }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      {/* ── Message panel ── */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {!activeSessionId ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <Typography>Chọn một hội thoại bên trái hoặc mở tin đăng và bấm &quot;Nhắn tin&quot;.</Typography>
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
                  <Typography variant="caption" color="text.secondary">
                    📦 {activeSession.listingTitle}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Messages area */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1.5 }}>
              {historyLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    currentUserId={currentUserId}
                    onAccept={handleAcceptOffer}
                    onReject={handleRejectOffer}
                  />
                ))
              )}

              {/* Typing indicator */}
              {typingUser && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                  <Typography variant="caption" fontStyle="italic">
                    Đang nhập...
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Quick replies */}
            {showQuickReplies && quickReplies.length > 0 && (
              <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {quickReplies.map((qr, i) => (
                  <Chip
                    key={i}
                    label={qr}
                    size="small"
                    clickable
                    variant="outlined"
                    onClick={() => handleSend(qr)}
                  />
                ))}
              </Box>
            )}

            <Divider />

            {/* Input area */}
            <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
              {/* Quick replies toggle */}
              <Tooltip title="Câu trả lời nhanh">
                <IconButton size="small" onClick={() => setShowQuickReplies((v) => !v)} color={showQuickReplies ? 'primary' : 'default'}>
                  <QuickreplyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Image upload */}
              <Tooltip title="Gửi ảnh (max 5MB)">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    color="default"
                  >
                    {imageUploading ? <CircularProgress size={18} /> : <AttachFileIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />

              {/* Make offer */}
              <Tooltip title="Trả giá">
                <IconButton size="small" onClick={() => setOfferDialogOpen(true)} color="default">
                  <MonetizationOnIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Text input */}
              <TextField
                size="small"
                fullWidth
                multiline
                maxRows={4}
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              {/* Send */}
              <IconButton
                color="primary"
                onClick={() => handleSend()}
                disabled={sending || !inputText?.trim()}
                sx={{ flexShrink: 0 }}
              >
                {sending ? <CircularProgress size={22} /> : <SendIcon />}
              </IconButton>
            </Box>
          </>
        )}
      </Paper>

      {/* ── Offer dialog ── */}
      <Dialog open={offerDialogOpen} onClose={() => setOfferDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>💰 Đề xuất giá</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Giá đề xuất (VND)"
            type="number"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Tối đa 5 lần đề xuất mỗi sản phẩm.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferDialogOpen(false)}>Huỷ</Button>
          <Button variant="contained" onClick={handleMakeOffer} disabled={!offerAmount}>
            Gửi đề xuất
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
