/**
 * Trang tin nhắn: danh sách hội thoại và khung chat thời gian thực.
 * UX kiểu marketplace: gợi ý nhanh, tin đang trao đổi, nhóm theo ngày.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Popover,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CancelIcon from '@mui/icons-material/Cancel';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
// WebSocket endpoint /chat không nằm dưới /api, phải dùng origin trực tiếp
const WS_URL = import.meta.env.VITE_WS_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/chat`
    : 'http://localhost:8080/chat');

// ── helpers ───────────────────────────────────────────────────────────────────

/** Ảnh chat lưu tại /uploads/** — không được gắn prefix /api (sẽ 403 qua nginx/Spring) */
function resolveChatImageSrc(fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http') || fileUrl.startsWith('blob:')) return fileUrl;
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  if (path.startsWith('/uploads/')) {
    const api = import.meta.env.VITE_API_BASE_URL || '';
    if (api.startsWith('http')) {
      try {
        return `${new URL(api).origin}${path}`;
      } catch {
        /* fall through */
      }
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return `http://localhost:8080${path}`;
  }
  return fileUrl.startsWith('http') ? fileUrl : `${API_BASE}${path}`;
}

function getData(res) {
  const b = res?.data;
  return b?.data ?? b;
}

function makeTempId() {
  return `tmp_${Date.now()}_${Math.random()}`;
}

/** Gợi ý khi API lỗi — ưu tiên theo vai (mua/bán). */
const LOCAL_BUYER_CHIPS = [
  'Cho mình hỏi sản phẩm còn không ạ?',
  'Giá có thương lượng thêm được không?',
  'Mình có thể qua xem hàng trực tiếp không?',
  'Bạn có ship / giao hàng được không?',
  'Bạn đang ở khu vực nào ạ?',
  'Mình chốt nhé, giữ giúp mình.',
];
const LOCAL_SELLER_CHIPS = [
  'Chào bạn, mình vẫn còn hàng nhé.',
  'Bạn qua xem trực tiếp được thì báo mình giờ nhé.',
  'Giá mình để là giá tốt rồi ạ.',
  'Mình có thể ship trong khu vực trường.',
  'Cảm ơn bạn đã quan tâm tin nhé!',
];

function sameCalendarDayVi(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatChatDayLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today0 - d0) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function formatSessionTimeShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = sameCalendarDayVi(iso, now.toISOString());
  if (sameDay) {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

// ── sub-components ────────────────────────────────────────────────────────────

function ImageBubble({ fileUrl }) {
  const src = resolveChatImageSrc(fileUrl);
  return (
    <Box
      component="img"
      src={src}
      alt="Ảnh"
      sx={{
        maxWidth: 220,
        maxHeight: 220,
        borderRadius: 1,
        display: 'block',
        objectFit: 'cover',
        cursor: 'pointer',
      }}
      onClick={() => window.open(src, '_blank')}
    />
  );
}

function OfferBubble({ msg, onAccept, onReject }) {
  const isMe = msg.isFromCurrentUser;
  // Chỉ coi là kết thúc khi BE trả về ACCEPTED/REJECTED. offerStatus null (lịch sử cũ) = vẫn đang chờ, không hiện "từ chối" nhầm.
  const isPending =
    msg.offerStatus === 'PENDING' ||
    (msg.messageType === 'OFFER_PROPOSAL' &&
      msg.offerStatus !== 'ACCEPTED' &&
      msg.offerStatus !== 'REJECTED');
  const showTerminalChip =
    msg.offerStatus === 'ACCEPTED' || msg.offerStatus === 'REJECTED';
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} gutterBottom>
        {msg.content}
      </Typography>
      {!isMe && isPending && msg.offerId != null && (
        <Stack direction="row" spacing={1} mt={0.5}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => onAccept(msg.offerId)}
          >
            Chấp nhận
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => onReject(msg.offerId)}
          >
            Từ chối
          </Button>
        </Stack>
      )}
      {showTerminalChip && (
        <Chip
          size="small"
          label={msg.offerStatus === 'ACCEPTED' ? '✅ Đã chấp nhận' : '❌ Đã từ chối'}
          color={msg.offerStatus === 'ACCEPTED' ? 'success' : 'error'}
          sx={{ mt: 0.5 }}
        />
      )}
    </Box>
  );
}

function Bubble({ msg, onAccept, onReject }) {
  const theme = useTheme();
  const isMe = msg.isFromCurrentUser === true;
  const isSystem = msg.messageType === 'DEAL_CONFIRMATION';
  const isPending = !!msg._pending;

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
        <Paper
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'success.light',
            border: '1px solid',
            borderColor: 'success.main',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" fontWeight={600} color="success.contrastText">
            {msg.content}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        mb: 1,
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: '78%',
          p: 1.75,
          bgcolor: isMe
            ? 'primary.main'
            : theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.08)
            : theme.palette.grey[100],
          color: isMe ? 'primary.contrastText' : 'text.primary',
          borderRadius: isMe ? '18px 6px 18px 18px' : '6px 18px 18px 18px',
          border: '1px solid',
          borderColor: isMe ? 'transparent' : alpha(theme.palette.divider, 0.5),
          boxShadow: isMe ? '0 2px 8px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {!isMe && msg.senderName && (
          <Typography
            variant="caption"
            display="block"
            fontWeight={700}
            sx={{ mb: 0.5, opacity: 0.75 }}
          >
            {msg.senderName}
          </Typography>
        )}

        {msg.messageType === 'IMAGE' ? (
          <ImageBubble fileUrl={msg.fileUrl} />
        ) : msg.messageType === 'OFFER_PROPOSAL' ? (
          <OfferBubble msg={msg} onAccept={onAccept} onReject={onReject} />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, opacity: 0.65 }}>
          <Typography variant="caption">
            {msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '…'}
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

// ── main component ────────────────────────────────────────────────────────────

export default function ChatPage() {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const currentUserId = currentUser?.id ?? currentUser?.user_id;

  // ── State ─────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(sessionIdFromUrl || null);
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionsVersion, setSessionsVersion] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [typingLabel, setTypingLabel] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Offer dialog
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  // Image preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [quickRepliesFromApi, setQuickRepliesFromApi] = useState([]);
  /** Anchor Popover gợi ý — null = đóng (dùng state để Popover mở đúng sau khi nút mount) */
  const [suggestAnchorEl, setSuggestAnchorEl] = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const stompRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const suggestBtnRef = useRef(null);
  const lastAutoSuggestSessionRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingSentRef = useRef(false);

  // ── Auto-scroll to bottom whenever messages change ────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Sync activeSessionId with URL param ───────────────────────────────────
  useEffect(() => {
    if (sessionIdFromUrl) setActiveSessionId(sessionIdFromUrl);
  }, [sessionIdFromUrl]);

  // Auto-open test session stored in localStorage
  useEffect(() => {
    const id = localStorage.getItem('slife_test_session_id');
    if (id && !activeSessionId) {
      setActiveSessionId(id);
      localStorage.removeItem('slife_test_session_id');
      setSessionsVersion((v) => v + 1);
    }
  }, [activeSessionId]);

  // Gợi ý câu từ BE + ưu tiên chip theo vai (mua / bán) trong phiên đang mở
  useEffect(() => {
    chatApi
      .getQuickReplies()
      .then((res) => {
        const raw = res?.data?.data ?? res?.data;
        setQuickRepliesFromApi(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setQuickRepliesFromApi([]));
  }, []);

  const activeSession = useMemo(
    () => sessions.find((s) => s.sessionId === activeSessionId),
    [sessions, activeSessionId]
  );

  const isSellerInActiveChat = useMemo(() => {
    if (!activeSession || currentUserId == null) return false;
    return Number(activeSession.sellerId) === Number(currentUserId);
  }, [activeSession, currentUserId]);

  const suggestedChatPhrases = useMemo(() => {
    const localFirst = isSellerInActiveChat ? LOCAL_SELLER_CHIPS : LOCAL_BUYER_CHIPS;
    const fromApi = Array.isArray(quickRepliesFromApi) ? quickRepliesFromApi : [];
    const seen = new Set();
    const out = [];
    for (const t of [...localFirst, ...fromApi]) {
      if (typeof t === 'string' && t.trim() && !seen.has(t)) {
        seen.add(t);
        out.push(t.trim());
      }
      if (out.length >= 14) break;
    }
    return out;
  }, [quickRepliesFromApi, isSellerInActiveChat]);

  // Tự mở tiện ích gợi ý khi vào cuộc chat (mỗi session một lần, sau khi tải xong lịch sử).
  // QUAN TRỌNG: không gắn lastAutoSuggestSessionRef trước khi mở — lần render đầu historyLoading
  // còn false, effect này chạy và bị cleanup khi fetch history set loading=true → nếu đã set cờ
  // thì lần sau historyLoading=false sẽ bỏ qua và popover không bao giờ mở.
  useEffect(() => {
    if (!activeSessionId) {
      lastAutoSuggestSessionRef.current = null;
      setSuggestAnchorEl(null);
      return;
    }
    if (historyLoading) return;
    if (lastAutoSuggestSessionRef.current === activeSessionId) return;

    let cancelled = false;
    const openWhenReady = () => {
      if (cancelled) return;
      const el = suggestBtnRef.current;
      if (el) {
        setSuggestAnchorEl(el);
        lastAutoSuggestSessionRef.current = activeSessionId;
        return;
      }
      // Sau khi load xong, thanh nhập có thể paint chậm hơn một frame
      requestAnimationFrame(() => {
        if (cancelled) return;
        const el2 = suggestBtnRef.current;
        if (el2) {
          setSuggestAnchorEl(el2);
          lastAutoSuggestSessionRef.current = activeSessionId;
        }
      });
    };

    const t = window.setTimeout(openWhenReady, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [activeSessionId, historyLoading]);

  // ── Fetch session list ────────────────────────────────────────────────────
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
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('[Chat] getChats failed:', err?.message ?? err);
        return [];
      });
  }, []);

  useEffect(() => {
    let alive = true;
    setSessionsLoading(true);
    fetchSessions().finally(() => {
      if (alive) setSessionsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [sessionsVersion, fetchSessions]);

  // Poll session list every 10 s when WebSocket is disconnected
  useEffect(() => {
    if (wsConnected) return;
    const id = setInterval(fetchSessions, 10000);
    return () => clearInterval(id);
  }, [wsConnected, fetchSessions]);

  // ── Fetch message history ─────────────────────────────────────────────────
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
        setMessages(Array.isArray(content) ? [...content].reverse() : []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  // Poll message history every 3 s (fallback when WS is unreliable)
  useEffect(() => {
    if (!activeSessionId) return;
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [activeSessionId, fetchHistory]);

  // ── WebSocket (STOMP) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSessionId || !currentUser) return;
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');

    const client = new StompClient({
      // JwtHandshakeHandler (BE) chỉ đọc JWT từ query ?token= trên SockJS handshake
      webSocketFactory: () => {
        const url = token
          ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
          : WS_URL;
        return new SockJS(url);
      },
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true);
        client.subscribe(`/topic/chat.${activeSessionId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            if (msg.type === 'TYPING') {
              if (!msg.isFromCurrentUser) {
                setTypingLabel(
                  msg.isTyping ? `${msg.senderName || 'Đối phương'} đang nhập...` : ''
                );
              }
              return;
            }
            if (msg.type === 'READ') {
              fetchHistory();
              return;
            }
            setMessages((prev) => {
              const cleaned = prev.filter((m) => !m._pending);
              if (cleaned.some((m) => m.id === msg.id)) return cleaned;
              return [...cleaned, msg];
            });
          } catch {
            // ignore parse errors
          }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false),
      onWebSocketClose: () => setWsConnected(false),
    });

    stompRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      stompRef.current = null;
      setWsConnected(false);
      setTypingLabel('');
    };
  }, [activeSessionId, currentUser, fetchHistory]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const stopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    if (typingSentRef.current && stompRef.current && activeSessionId) {
      try {
        stompRef.current.publish({
          destination: '/app/chat.typing',
          body: JSON.stringify({ sessionId: activeSessionId, isTyping: false }),
        });
      } catch {
        setWsConnected(false);
      }
      typingSentRef.current = false;
    }
  }, [activeSessionId]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!wsConnected || !stompRef.current || !activeSessionId) return;
    if (!typingSentRef.current) {
      try {
        stompRef.current.publish({
          destination: '/app/chat.typing',
          body: JSON.stringify({ sessionId: activeSessionId, isTyping: true }),
        });
        typingSentRef.current = true;
      } catch {
        setWsConnected(false);
      }
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 2500);
  };

  // ── Send text message ─────────────────────────────────────────────────────
  /**
   * Luôn gửi qua REST — tin cậy cho chip gợi ý & ô nhập (BE vẫn broadcast WS cho đối phương).
   * Trước đây gửi qua STOMP khi wsConnected: server có thể bỏ qua im lặng (principal) và không
   * gọi fetchHistory → nhìn như “không gửi được”.
   */
  const handleSend = async (optionalText) => {
    let text;
    if (typeof optionalText === 'string' || typeof optionalText === 'number') {
      text = String(optionalText).trim();
    } else {
      text = (inputText || '').trim();
    }
    if (!text || !activeSessionId || sending) return;
    setSending(true);
    setInputText('');
    stopTyping();
    try {
      await chatApi.sendMessage(activeSessionId, text);
      await fetchHistory();
      fetchSessions();
    } catch (e) {
      console.error('[Chat] send failed', e);
      const detail =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Gửi tin nhắn thất bại';
      alert(detail);
    } finally {
      setSending(false);
    }
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const MAX = 5 * 1024 * 1024;
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (file.size > MAX) {
      setUploadError('Ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.');
      setPreviewOpen(true);
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      setUploadError('Chỉ chấp nhận JPG, PNG, WebP.');
      setPreviewOpen(true);
      return;
    }

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

    const optimistic = {
      id: makeTempId(),
      _pending: true,
      sessionId: activeSessionId,
      senderId: currentUserId,
      senderName: currentUser?.fullName || 'Bạn',
      content: '[Hình ảnh]',
      messageType: 'IMAGE',
      fileUrl: previewSrc,
      timestamp: new Date().toISOString(),
      isRead: false,
      isFromCurrentUser: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const uploadRes = await chatApi.uploadChatImage(activeSessionId, previewFile);
      const fileUrl = getData(uploadRes);
      if (!fileUrl) throw new Error('No URL returned from upload');

      const msgRes = await chatApi.sendMessage(
        activeSessionId,
        '[Hình ảnh]',
        'IMAGE',
        fileUrl
      );
      const msg = getData(msgRes);

      setMessages((prev) => {
        const cleaned = prev.filter((m) => !m._pending);
        return msg?.id ? [...cleaned, msg] : cleaned;
      });
      fetchSessions();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m._pending));
      const detail =
        err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      alert(`Gửi ảnh thất bại: ${detail}`);
      console.error('[Chat] image send failed', err);
    } finally {
      setImageUploading(false);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      setPreviewSrc(null);
      setPreviewFile(null);
    }
  };

  // ── Offer ─────────────────────────────────────────────────────────────────
  const submitOffer = async () => {
    const amount = parseFloat(String(offerAmount).replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0 || !activeSessionId) return;
    setOfferOpen(false);
    setOfferAmount('');
    try {
      const res = await chatApi.makeOffer(activeSessionId, amount);
      const msg = getData(res);
      if (msg?.id) setMessages((prev) => [...prev, msg]);
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
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.offerId === offerId ? { ...m, offerStatus: 'ACCEPTED' } : m
        );
        return msg?.id && !updated.some((m) => m.id === msg.id)
          ? [...updated, msg]
          : updated;
      });
      await fetchHistory();
      fetchSessions();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi');
    }
  };

  const handleReject = async (offerId) => {
    try {
      await chatApi.respondToOffer(offerId, 'REJECTED');
      setMessages((prev) =>
        prev.map((m) =>
          m.offerId === offerId ? { ...m, offerStatus: 'REJECTED' } : m
        )
      );
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi');
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: { xs: 'auto', md: 'calc(100vh - 120px)' },
        minHeight: { xs: '70vh', md: undefined },
        maxWidth: 1120,
        mx: 'auto',
        pt: 2,
        px: { xs: 0.5, sm: 1 },
        gap: 2,
        alignItems: 'stretch',
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.black, 0.15)
            : alpha(theme.palette.primary.main, 0.04),
        borderRadius: 3,
      }}
    >
      {/* ── Session list ── */}
      <Paper
        elevation={2}
        sx={{
          width: { xs: '100%', sm: 300 },
          maxWidth: { xs: 320, sm: 300 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 3,
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatBubbleOutlineIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            Tin nhắn
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 1 }}>
          Trao đổi nhanh như trên chợ — gửi ảnh, trả giá, hẹn xem hàng.
        </Typography>
        <Divider />
        {sessionsLoading ? (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense sx={{ flex: 1, overflow: 'auto', pt: 0 }}>
            {sessions.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, py: 2 }}
              >
                Chưa có hội thoại. Vào tin đăng và bấm &quot;Nhắn tin&quot; để bắt đầu.
              </Typography>
            )}
            {sessions.map((s) => (
              <ListItemButton
                key={s.sessionId}
                selected={s.sessionId === activeSessionId}
                onClick={() => setActiveSessionId(s.sessionId)}
                sx={{
                  py: 1.25,
                  alignItems: 'flex-start',
                  borderRadius: 2,
                  mx: 0.5,
                  mb: 0.25,
                }}
              >
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    mr: 1.5,
                    bgcolor: 'primary.main',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {(
                    s.otherParticipantName ||
                    s.listingTitle ||
                    'C'
                  )[0]?.toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={s.otherParticipantName || s.listingTitle || 'Chat'}
                  secondary={s.lastMessagePreview || 'Chưa có tin nhắn'}
                  primaryTypographyProps={{
                    noWrap: true,
                    fontWeight: s.unreadCount > 0 ? 700 : 600,
                    fontSize: '0.9rem',
                  }}
                  secondaryTypographyProps={{ noWrap: true, fontSize: '0.75rem' }}
                  sx={{ mr: 0.5, minWidth: 0 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                    {formatSessionTimeShort(s.lastMessageAt)}
                  </Typography>
                  {s.unreadCount > 0 && (
                    <Badge badgeContent={s.unreadCount} color="primary" sx={{ mt: 0.5 }} />
                  )}
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      {/* ── Chat panel ── */}
      <Paper
        elevation={2}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {!activeSessionId ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              p: 4,
              textAlign: 'center',
            }}
          >
            <StorefrontOutlinedIcon sx={{ fontSize: 48, opacity: 0.35, mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Chọn cuộc trò chuyện
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 320, mt: 1 }}>
              Mở một tin đăng và bấm <strong>Nhắn tin</strong> để hỏi hàng, trả giá hoặc hẹn gặp — giống các sàn
              đồ cũ phổ biến.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: (t) =>
                  t.palette.mode === 'dark'
                    ? alpha(t.palette.primary.main, 0.12)
                    : alpha(t.palette.primary.main, 0.06),
              }}
            >
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: 'primary.main',
                  fontSize: 18,
                }}
              >
                {(
                  activeSession?.otherParticipantName ||
                  activeSession?.listingTitle ||
                  'C'
                )[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {activeSession?.otherParticipantName ||
                    activeSession?.listingTitle ||
                    'Chat'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {isSellerInActiveChat
                    ? 'Bạn đang chat với người quan tâm tin của bạn'
                    : 'Nhắn trực tiếp với người bán — an toàn hơn khi giao dịch trong app'}
                </Typography>
              </Box>
              {wsConnected && (
                <Chip size="small" label="Đang kết nối" color="success" variant="outlined" sx={{ height: 26 }} />
              )}
            </Box>

            {/* Tin đang trao đổi (giống banner chợ) */}
            {activeSession?.listingId != null && (
              <Box
                component={Link}
                to={`/listings/${activeSession.listingId}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  borderBottom: 1,
                  borderColor: 'divider',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <StorefrontOutlinedIcon color="primary" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Tin đang trao đổi
                  </Typography>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {activeSession.listingTitle || `Tin #${activeSession.listingId}`}
                  </Typography>
                </Box>
                <Chip size="small" icon={<OpenInNewIcon fontSize="small" />} label="Xem tin" variant="outlined" />
              </Box>
            )}

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.black, 0.2)
                    : alpha(theme.palette.grey[500], 0.08),
              }}
            >
              {historyLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={28} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                  <LightbulbOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Bắt đầu hội thoại
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
                    Bấm icon <strong>bóng đèn</strong> cạnh nút gửi ảnh và trả giá để mở <strong>gợi ý nhanh</strong> — hộp
                    đó tự hiện khi bạn vào chat. Hoặc gõ tin ở ô bên dưới.
                  </Typography>
                </Box>
              ) : (
                messages.map((m, idx) => {
                  const msgIsMe =
                    m.isFromCurrentUser === true ||
                    (currentUserId != null && m.senderId === currentUserId);
                  const prev = idx > 0 ? messages[idx - 1] : null;
                  const showDay =
                    idx === 0 || !sameCalendarDayVi(prev?.timestamp, m.timestamp);
                  return (
                    <Fragment key={`msg-${idx}-${m.id}-${m._pending ? 'p' : 's'}`}>
                      {showDay && m.timestamp && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                          <Chip
                            size="small"
                            label={formatChatDayLabel(m.timestamp)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      )}
                      <Bubble
                        msg={{ ...m, isFromCurrentUser: msgIsMe }}
                        onAccept={handleAccept}
                        onReject={handleReject}
                      />
                    </Fragment>
                  );
                })
              )}
              {typingLabel && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    mb: 1,
                  }}
                >
                  <CircularProgress size={12} />
                  <Typography variant="caption" color="text.secondary">
                    {typingLabel}
                  </Typography>
                </Box>
              )}
              <div ref={bottomRef} />
            </Box>

            {/* Ô nhập + tiện ích (ảnh, trả giá, gợi ý bóng đèn) */}
            <Box
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Popover
                open={Boolean(suggestAnchorEl)}
                anchorEl={suggestAnchorEl}
                onClose={() => setSuggestAnchorEl(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                PaperProps={{
                  sx: {
                    p: 2,
                    width: { xs: 'min(100vw - 32px, 360px)', sm: 360 },
                    maxHeight: 'min(420px, 55vh)',
                    overflow: 'auto',
                    borderRadius: 2,
                    boxShadow: 6,
                  },
                }}
              >
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                  <LightbulbOutlinedIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Gợi ý nhanh
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Một bấm là <strong>gửi tin ngay</strong>. Đóng hộp này rồi mở lại bằng icon bóng đèn bất cứ lúc nào.
                </Typography>
                <Stack spacing={1}>
                  {suggestedChatPhrases.map((phrase) => (
                    <Chip
                      key={phrase}
                      label={phrase}
                      size="medium"
                      variant="outlined"
                      color="primary"
                      disabled={sending}
                      onClick={() => {
                        void handleSend(phrase);
                        setSuggestAnchorEl(null);
                      }}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        py: 0.5,
                        '& .MuiChip-label': {
                          whiteSpace: 'normal',
                          textAlign: 'left',
                          display: 'block',
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Popover>

              <Paper
                elevation={0}
                sx={{
                  m: 1.5,
                  p: 1,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.03) : 'grey.50',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Tooltip title="Gửi ảnh (JPG, PNG, WebP)">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading || !activeSessionId}
                        sx={{ bgcolor: 'action.hover' }}
                      >
                        {imageUploading ? <CircularProgress size={20} /> : <AttachFileIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Trả giá / đề xuất giá">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => setOfferOpen(true)}
                        disabled={!activeSessionId}
                        sx={{ bgcolor: 'action.hover' }}
                      >
                        <MonetizationOnIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip
                    title={
                      suggestAnchorEl
                        ? 'Đóng gợi ý nhanh'
                        : 'Gợi ý nhanh — câu hay dùng khi mua/bán (tự mở khi vào chat)'
                    }
                  >
                    <span>
                      <IconButton
                        ref={suggestBtnRef}
                        size="small"
                        onClick={(e) => {
                          if (suggestAnchorEl) setSuggestAnchorEl(null);
                          else setSuggestAnchorEl(e.currentTarget);
                        }}
                        disabled={!activeSessionId}
                        color={suggestAnchorEl ? 'primary' : 'default'}
                        sx={{
                          bgcolor: suggestAnchorEl ? alpha(theme.palette.primary.main, 0.15) : 'action.hover',
                          border: suggestAnchorEl ? 1 : 0,
                          borderColor: 'primary.main',
                        }}
                      >
                        <LightbulbOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <TextField
                    inputRef={inputRef}
                    size="small"
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Nhập tin nhắn… (Enter gửi, Shift+Enter xuống dòng)"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' },
                    }}
                  />
                  <Tooltip title="Gửi">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={() => void handleSend()}
                        disabled={sending || !inputText?.trim()}
                        sx={{
                          flexShrink: 0,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' },
                          '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                        }}
                      >
                        {sending ? <CircularProgress size={22} color="inherit" /> : <SendIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Paper>
            </Box>
          </>
        )}
      </Paper>

      {/* ── Image preview dialog ── */}
      <Dialog open={previewOpen} onClose={cancelPreview} maxWidth="sm">
        <DialogTitle>Xem trước ảnh</DialogTitle>
        <DialogContent>
          {uploadError ? (
            <Typography color="error">{uploadError}</Typography>
          ) : (
            previewSrc && (
              <Box
                component="img"
                src={previewSrc}
                alt="Preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 400,
                  display: 'block',
                  mx: 'auto',
                  borderRadius: 1,
                }}
              />
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelPreview}>Hủy</Button>
          {!uploadError && (
            <Button
              variant="contained"
              onClick={confirmSendImage}
              disabled={imageUploading}
            >
              {imageUploading ? <CircularProgress size={20} /> : 'Gửi'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Offer dialog ── */}
      <Dialog
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Đề xuất giá</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Số tiền (VNĐ)"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            type="number"
            inputProps={{ min: 0 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOfferOpen(false);
              setOfferAmount('');
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={submitOffer}
            disabled={!offerAmount || parseFloat(offerAmount) <= 0}
          >
            Gửi đề xuất
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
