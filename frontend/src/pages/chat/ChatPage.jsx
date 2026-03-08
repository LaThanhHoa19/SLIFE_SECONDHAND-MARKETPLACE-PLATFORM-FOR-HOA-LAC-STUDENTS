/**
 * Trang tin nhắn: danh sách hội thoại hoặc một cuộc hội thoại (sessionId từ URL).
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  Paper,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';

function getPayload(res) {
  const body = res?.data;
  return body?.data ?? body;
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
    const testSessionId = localStorage.getItem('slife_test_session_id');
    if (testSessionId && !activeSessionId) {
      setActiveSessionId(testSessionId);
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
    let cancelled = false;
    setSessionsLoading(true);
    fetchSessions().finally(() => {
      if (!cancelled) setSessionsLoading(false);
    });
    return () => { cancelled = true; };
  }, [sessionsVersion, fetchSessions]);

  // Poll sessions mỗi 8 giây để tự động hiện conversation mới (từ Real User hoặc người khác)
  useEffect(() => {
    const interval = setInterval(fetchSessions, 8000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Load lịch sử khi chọn 1 session + polling để cả hai bên đều thấy tin mới
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

  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', maxWidth: 1000, mx: 'auto', pt: 2 }}>
      <Paper sx={{ width: 280, mr: 2, overflow: 'auto', flexShrink: 0 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2, pb: 0 }}>
          Tin nhắn
        </Typography>
        {sessionsLoading ? (
          <Box sx={{ p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
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
              <Typography variant="subtitle1" fontWeight={600}>
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
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
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
