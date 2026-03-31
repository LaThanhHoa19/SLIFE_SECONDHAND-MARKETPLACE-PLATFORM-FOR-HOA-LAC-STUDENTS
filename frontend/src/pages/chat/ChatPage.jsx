/**
 * Trang tin nhắn: danh sách hội thoại và khung chat thời gian thực.
 * UX kiểu marketplace: gợi ý nhanh, tin đang trao đổi, nhóm theo ngày.
 */
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
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
  Fab,
  IconButton,
  List,
  Menu,
  MenuItem,
  ListItemIcon,
  Popover,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  ThemeProvider,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { chatDarkTheme } from '../../theme/chatDarkTheme';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';
import { getListing } from '../../api/listingApi';
import { useToast } from '../../context/ToastContext';
import Bubble from './components/Bubble';
import { fullImageUrl } from '../../utils/constants';
import {
  CHAT_NEAR_BOTTOM_PX,
  LOCAL_BUYER_CHIPS,
  LOCAL_SELLER_CHIPS,
  enrichMessagesForDisplay,
  formatChatDayLabel,
  formatSessionTimeShort,
  getData,
  getMessageDomId,
  getMessageRowKey,
  isMessageFromCurrentUser,
  makeTempId,
  sameCalendarDayVi,
  upsertMessages,
} from './chatMessageUtils';

// WebSocket endpoint /chat không nằm dưới /api, phải dùng origin trực tiếp
const WS_URL = import.meta.env.VITE_WS_URL ||
    (typeof window !== 'undefined'
        ? `${window.location.origin}/chat`
        : 'http://localhost:8080/chat');
// ── main component ────────────────────────────────────────────────────────────

function ChatPageInner() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const { user: currentUser, token: authToken } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const messageIdFromUrl = searchParams.get('messageId');
  const currentUserId = currentUser?.id ?? currentUser?.user_id;

  // ── State ─────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(sessionIdFromUrl || null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionsVersion, setSessionsVersion] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [typingLabel, setTypingLabel] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [composerRef, setComposerRef] = useState(null);

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
  const bottomRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const messagesRef = useRef(messages);
  /** Snapshot danh sách tin để diff tin mới từ đối phương khi không ở đáy */
  const prevMessagesForDiffRef = useRef([]);
  /** Bỏ qua một lần diff sau khi mình vừa gửi (fetchHistory / setMessages) để không cộng nhầm */
  const suppressOpponentDiffRef = useRef(false);
  /** Sau đổi session: cuộn đáy đồng bộ trong layout (trước khi đếm tin mới — tránh scrollTop=0 nhầm là đang xem lịch sử) */
  const didInitialScrollForSessionRef = useRef(false);
  const typingTimerRef = useRef(null);
  const typingSentRef = useRef(false);
  /** Debounce gọi getChats sau WS — cập nhật preview cột trái không cần reload trang */
  const fetchSessionsDebounceRef = useRef(null);

  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [newOpponentMsgCount, setNewOpponentMsgCount] = useState(0);
  const [listingMetaById, setListingMetaById] = useState({});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const displayMessages = useMemo(() => enrichMessagesForDisplay(messages), [messages]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: behavior === 'auto' ? 'auto' : 'smooth', block: 'end' });
    });
  }, []);

  const updateJumpToLatestVisibility = useCallback(() => {
    const el = messagesScrollRef.current;
    const list = messagesRef.current;
    if (!el || list.length === 0) {
      setShowJumpToLatest(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distFromBottom <= CHAT_NEAR_BOTTOM_PX;
    setShowJumpToLatest(!nearBottom);
    if (nearBottom) {
      setNewOpponentMsgCount(0);
      prevMessagesForDiffRef.current = list.slice();
    }
  }, []);

  useEffect(() => {
    setNewOpponentMsgCount(0);
    prevMessagesForDiffRef.current = [];
    didInitialScrollForSessionRef.current = false;
    setHighlightedMessageId(null);
  }, [activeSessionId]);

  // Khi deep-link đổi messageId (kể cả cùng session), cho phép chạy lại flow scroll-to-message.
  useEffect(() => {
    if (!messageIdFromUrl) return;
    didInitialScrollForSessionRef.current = false;
    setHighlightedMessageId(null);
  }, [messageIdFromUrl]);

  // Lần đầu có lịch sử sau đổi session: cuộn đáy ngay trong layout; sau đó mới đếm tin đối phương khi không ở đáy.
  useLayoutEffect(() => {
    messagesRef.current = messages;
    if (!activeSessionId || historyLoading) return;

    const el = messagesScrollRef.current;

    if (!didInitialScrollForSessionRef.current) {
      if (messages.length === 0) {
        prevMessagesForDiffRef.current = [];
        return;
      }
      didInitialScrollForSessionRef.current = true;
      const targetId = messageIdFromUrl ? String(messageIdFromUrl) : null;
      const targetEl = targetId ? document.getElementById(`chat-msg-${targetId}`) : null;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'auto', block: 'center' });
        setHighlightedMessageId(targetId);
        window.setTimeout(() => setHighlightedMessageId(null), 2500);
      } else if (el) {
        el.scrollTop = el.scrollHeight;
      }
      setNewOpponentMsgCount(0);
      prevMessagesForDiffRef.current = messages.slice();
      updateJumpToLatestVisibility();
      return;
    }

    if (suppressOpponentDiffRef.current) {
      suppressOpponentDiffRef.current = false;
      prevMessagesForDiffRef.current = messages.slice();
      return;
    }

    if (!el || messages.length === 0) {
      prevMessagesForDiffRef.current = [];
      setNewOpponentMsgCount(0);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = el;
    const nearBottom = scrollHeight - scrollTop - clientHeight <= CHAT_NEAR_BOTTOM_PX;
    if (nearBottom) {
      setNewOpponentMsgCount(0);
      prevMessagesForDiffRef.current = messages.slice();
      return;
    }

    const prev = prevMessagesForDiffRef.current;
    const prevIds = new Set(prev.map((m) => String(m.id)));
    let addedFromOther = 0;
    for (const m of messages) {
      const id = String(m.id);
      if (prevIds.has(id)) continue;
      if (isMessageFromCurrentUser(m, currentUserId)) continue;
      addedFromOther += 1;
    }
    if (addedFromOther > 0) {
      setNewOpponentMsgCount((c) => c + addedFromOther);
    }
    prevMessagesForDiffRef.current = messages.slice();
  }, [messages, activeSessionId, historyLoading, currentUserId, updateJumpToLatestVisibility, messageIdFromUrl]);

  // Cập nhật nút “Mới nhất” khi nội dung đổi (không tự cuộn).
  useEffect(() => {
    updateJumpToLatestVisibility();
  }, [messages, updateJumpToLatestVisibility]);

  // ── Sync activeSessionId with URL param ───────────────────────────────────
  useEffect(() => {
    if (sessionIdFromUrl) setActiveSessionId(sessionIdFromUrl);
  }, [sessionIdFromUrl]);

  useEffect(() => {
    setSuggestAnchorEl(null);
  }, [activeSessionId]);

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

  const activeListingThumb = useMemo(() => {
    const raw =
        activeSession?.listingImageUrl ||
        activeSession?.listingImage ||
        activeSession?.listingThumbnailUrl ||
        (activeSession?.listingId != null ? listingMetaById[activeSession.listingId]?.thumb : null);
    return fullImageUrl(raw);
  }, [activeSession, listingMetaById]);
  const activeListingPrice = useMemo(() => {
    if (activeSession?.listingPrice != null) return Number(activeSession.listingPrice);
    if (activeSession?.listingId != null) return Number(listingMetaById[activeSession.listingId]?.price ?? NaN);
    return NaN;
  }, [activeSession, listingMetaById]);

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

  const scheduleFetchSessions = useCallback(() => {
    if (fetchSessionsDebounceRef.current != null) {
      window.clearTimeout(fetchSessionsDebounceRef.current);
    }
    fetchSessionsDebounceRef.current = window.setTimeout(() => {
      fetchSessionsDebounceRef.current = null;
      fetchSessions();
    }, 350);
  }, [fetchSessions]);

  useEffect(() => {
    return () => {
      if (fetchSessionsDebounceRef.current != null) {
        window.clearTimeout(fetchSessionsDebounceRef.current);
        fetchSessionsDebounceRef.current = null;
      }
    };
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

  // Nạp thumbnail cho banner "Tin đang trao đổi" (fallback nếu session chưa trả sẵn ảnh).
  useEffect(() => {
    const listingIds = Array.from(
        new Set(
            (sessions || [])
                .map((s) => s?.listingId)
                .filter((id) => Number.isFinite(Number(id)))
                .map((id) => Number(id)),
        ),
    );
    const missingIds = listingIds.filter((id) => !listingMetaById[id]);
    if (missingIds.length === 0) return;

    let cancelled = false;
    Promise.all(
        missingIds.map(async (id) => {
          try {
            const res = await getListing(id);
            const body = res?.data;
            const data = body?.data ?? body;
            const thumb = Array.isArray(data?.images) ? data.images[0] : null;
            const price = data?.price != null ? Number(data.price) : null;
            return [id, { thumb: thumb || null, price }];
          } catch {
            return [id, { thumb: null, price: null }];
          }
        }),
    ).then((pairs) => {
      if (cancelled) return;
      setListingMetaById((prev) => {
        const next = { ...prev };
        pairs.forEach(([id, meta]) => {
          next[id] = meta;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [sessions, listingMetaById]);

  /**
   * WS chỉ subscribe đúng 1 session — preview các cuộc khác vẫn cần REST.
   * Luôn poll nhẹ danh sách; khi WS mở vẫn gọi scheduleFetchSessions khi có tin (nhanh hơn).
   */
  useEffect(() => {
    const ms = wsConnected ? 12000 : 8000;
    const id = window.setInterval(fetchSessions, ms);
    return () => window.clearInterval(id);
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

    const loadHistory = async () => {
      try {
        const targetId = messageIdFromUrl ? String(messageIdFromUrl) : null;
        const pageSize = 30;

        // Bình thường: chỉ lấy page 0.
        if (!targetId) {
          const res = await chatApi.getHistory(activeSessionId, 0, pageSize);
          if (cancelled) return;
          const body = res?.data;
          const page = body?.data ?? body;
          const content = page?.content ?? (Array.isArray(page) ? page : []);
          setMessages(Array.isArray(content) ? [...content].reverse() : []);
          return;
        }

        // Deep-link: tải thêm trang để tăng khả năng chứa message mục tiêu.
        const maxPagesToScan = 8;
        const aggregated = [];
        let found = false;

        for (let p = 0; p < maxPagesToScan; p += 1) {
          const res = await chatApi.getHistory(activeSessionId, p, pageSize);
          if (cancelled) return;
          const body = res?.data;
          const page = body?.data ?? body;
          const content = Array.isArray(page?.content)
              ? page.content
              : Array.isArray(page)
                  ? page
                  : [];

          if (content.length === 0) break;
          aggregated.push(...content);

          if (content.some((m) => String(m?.id) === targetId)) {
            found = true;
            break;
          }
          if (content.length < pageSize) break;
        }

        if (cancelled) return;
        const base = aggregated.length > 0 ? aggregated : [];
        setMessages([...base].reverse());

        if (!found && import.meta.env.DEV) {
          console.warn('[Chat] target messageId not found in scanned history:', targetId);
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId, messageIdFromUrl]);

  // Poll message history every 3 s only when WS is disconnected.
  useEffect(() => {
    if (!activeSessionId || wsConnected) return;
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [activeSessionId, fetchHistory, wsConnected]);

  useEffect(() => {
    if (!activeSessionId) return;
    chatApi.markSessionRead(activeSessionId).catch(() => {});
  }, [activeSessionId]);

  // ── WebSocket (STOMP) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSessionId || !currentUser) return;
    const token =
        authToken ||
        localStorage.getItem('slife_access_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');

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
            if (msg?.event === 'TYPING' || msg?.type === 'TYPING') {
              const senderEmail = (msg?.senderEmail || '').toLowerCase();
              const myEmail = (currentUser?.email || '').toLowerCase();
              const isSelfTyping = !!senderEmail && !!myEmail && senderEmail === myEmail;
              if (!isSelfTyping) {
                setTypingLabel(msg?.isTyping ? 'Đối phương đang nhập...' : '');
              }
              return;
            }
            if (msg?.event === 'READ' || msg?.type === 'READ') {
              fetchHistory();
              scheduleFetchSessions();
              return;
            }
            setMessages((prev) => {
              return upsertMessages(prev, msg, { dropPending: true });
            });
            scheduleFetchSessions();
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
  }, [activeSessionId, currentUser, fetchHistory, authToken, scheduleFetchSessions]);

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
      suppressOpponentDiffRef.current = true;
      await chatApi.sendMessage(activeSessionId, text, 'TEXT', null, {
        replyToMessageId: composerRef?.id ?? null,
        quoteMessageId: null,
      });
      setComposerRef(null);
      await fetchHistory();
      fetchSessions();
      scrollToBottom('smooth');
      setNewOpponentMsgCount(0);
    } catch (e) {
      console.error('[Chat] send failed', e);
      const detail =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          'Gửi tin nhắn thất bại';
      showToast(detail, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleReplyMessage = (msg) => {
    if (!msg?.id) return;
    setComposerRef({
      id: msg.id,
      content: msg.content || '[Tin nhắn]',
      senderName: msg.senderName || 'Người dùng',
    });
    inputRef.current?.focus();
  };

  const handleJumpToMessage = (messageId) => {
    const domId = getMessageDomId(messageId);
    if (!domId) return;
    const el = document.getElementById(domId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(String(messageId));
    window.setTimeout(() => setHighlightedMessageId(null), 1800);
  };

  const handleReportMessage = useCallback(
      (msg) => {
        const mid = msg?.id;
        if (mid == null || String(mid).startsWith('tmp')) return;
        const q = new URLSearchParams({
          targetType: 'MESSAGE',
          targetId: String(mid),
        });
        if (activeSessionId) q.set('sessionId', activeSessionId);
        navigate(`/report?${q.toString()}`);
      },
      [navigate, activeSessionId]
  );

  const handleChatMobileBack = useCallback(() => {
    setActiveSessionId(null);
    setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('sessionId');
          next.delete('messageId');
          return next;
        },
        { replace: true }
    );
  }, [setSearchParams]);

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
          fileUrl,
          {
            replyToMessageId: composerRef?.id ?? null,
            quoteMessageId: null,
          }
      );
      const msg = getData(msgRes);
      setComposerRef(null);

      suppressOpponentDiffRef.current = true;
      setMessages((prev) => {
        if (!msg?.id) return prev.filter((m) => !m._pending);
        return upsertMessages(prev, msg, { dropPending: true });
      });
      fetchSessions();
      scrollToBottom('smooth');
      setNewOpponentMsgCount(0);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m._pending));
      const detail =
          err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      showToast(`Gửi ảnh thất bại: ${detail}`, 'error');
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
      suppressOpponentDiffRef.current = true;
      const res = await chatApi.makeOffer(activeSessionId, amount);
      const msg = getData(res);
      if (msg?.id) setMessages((prev) => upsertMessages(prev, msg));
      fetchSessions();
      scrollToBottom('smooth');
      setNewOpponentMsgCount(0);
    } catch (err) {
      const detail = err?.response?.data?.message || 'Lỗi không xác định';
      showToast(`Đề xuất thất bại: ${detail}`, 'error');
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
      showToast(err?.response?.data?.message || 'Lỗi', 'error');
    }
  };

  const handleReject = async (offerId) => {
    try {
      const res = await chatApi.respondToOffer(offerId, 'REJECTED');
      const msg = getData(res);
      setMessages((prev) => {
        const updated = prev.map((m) =>
            m.offerId === offerId ? { ...m, offerStatus: 'REJECTED' } : m
        );
        return msg?.id && !updated.some((m) => m.id === msg.id)
            ? [...updated, msg]
            : updated;
      });
      await fetchHistory();
      fetchSessions();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Lỗi', 'error');
    }
  };

  const parsedOfferAmount = Number(String(offerAmount || '').replace(/[^\d.]/g, ''));
  const canSubmitOffer = Number.isFinite(parsedOfferAmount) && parsedOfferAmount > 0;
  const formattedOfferAmount = canSubmitOffer
      ? `${parsedOfferAmount.toLocaleString('vi-VN')}đ`
      : null;
  const formattedListingPrice = Number.isFinite(activeListingPrice) && activeListingPrice > 0
      ? `${activeListingPrice.toLocaleString('vi-VN')}đ`
      : null;
  const quickOfferSuggestions = useMemo(() => {
    if (!Number.isFinite(activeListingPrice) || activeListingPrice <= 0) return [];
    const toStep = (n) => Math.max(1000, Math.round(n / 10000) * 10000);
    const arr = [toStep(activeListingPrice * 0.85), toStep(activeListingPrice * 0.9), toStep(activeListingPrice * 0.95)];
    return Array.from(new Set(arr));
  }, [activeListingPrice]);

  // ── render ────────────────────────────────────────────────────────────────
  const showConversationMobile = Boolean(activeSessionId);
  const listDisplay = { xs: showConversationMobile ? 'none' : 'flex', md: 'flex' };
  const panelDisplay = { xs: showConversationMobile ? 'flex' : 'none', md: 'flex' };

  return (
      <Box
          sx={{
            height: '100dvh',
            width: '100%',
            maxWidth: '100%',
            mx: 0,
            pt: 0,
            px: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'background.default',
            backgroundImage:
                theme.palette.mode === 'dark'
                    ? 'radial-gradient(1200px 500px at 10% -10%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px 420px at 100% 0%, rgba(59,130,246,0.12), transparent 60%)'
                    : 'radial-gradient(1200px 500px at 10% -10%, rgba(124,58,237,0.08), transparent 60%), radial-gradient(900px 420px at 100% 0%, rgba(59,130,246,0.08), transparent 60%)',
          }}
      >
        <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              minHeight: 0,
              overflow: 'hidden',
            }}
        >
          {/* ── Session list ── */}
          <Paper
              elevation={0}
              sx={{
                width: { xs: '100%', md: 336 },
                maxWidth: { xs: '100%', md: 336 },
                flexShrink: 0,
                display: listDisplay,
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: { xs: 0, md: 3 },
                borderRight: { md: 1 },
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.82 : 0.95),
                backdropFilter: 'blur(10px)',
                m: { xs: 0, md: 1.25 },
              }}
          >
            <Box
                sx={{
                  px: 1,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
            >
              <IconButton size="small" aria-label="Về bảng tin" onClick={() => navigate('/feed')}>
                <ArrowBackIcon />
              </IconButton>
              <ChatBubbleOutlineIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>
                Tin nhắn
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
              Trao đổi nhanh — gửi ảnh, trả giá, hẹn xem hàng.
            </Typography>
            <Divider />
            {sessionsLoading ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
            ) : (
                <List
                    dense
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      pt: 0,
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${alpha(theme.palette.primary.main, 0.42)} ${alpha(theme.palette.common.white, 0.06)}`,
                      '&::-webkit-scrollbar': {
                        width: 9,
                      },
                      '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.common.white, 0.04),
                        borderRadius: 999,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.primary.main, 0.46),
                        borderRadius: 999,
                        border: `2px solid ${alpha(theme.palette.background.paper, 0.75)}`,
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: alpha(theme.palette.primary.light, 0.62),
                      },
                    }}
                >
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
                            py: 1.1,
                            alignItems: 'flex-start',
                            borderRadius: 2.25,
                            mx: 0.75,
                            mb: 0.4,
                            border: '1px solid',
                            borderColor:
                                s.sessionId === activeSessionId
                                    ? alpha(theme.palette.primary.main, 0.45)
                                    : 'transparent',
                            bgcolor:
                                s.sessionId === activeSessionId
                                    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.1)
                                    : 'transparent',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
                            },
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
              elevation={0}
              sx={{
                flex: 1,
                display: panelDisplay,
                flexDirection: 'column',
                minWidth: 0,
                minHeight: 0,
                borderRadius: { xs: 0, md: 3 },
                overflow: 'hidden',
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.78 : 0.95),
                backdropFilter: 'blur(12px)',
                m: { xs: 0, md: 1.25 },
                ml: { xs: 0, md: 0 },
                border: { xs: 0, md: '1px solid' },
                borderColor: { xs: 'transparent', md: alpha(theme.palette.divider, 0.35) },
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
                        px: { xs: 0.5, sm: 2 },
                        py: 1.25,
                        borderBottom: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 0.98),
                      }}
                  >
                    {!isMdUp ? (
                        <IconButton size="small" aria-label="Danh sách hội thoại" onClick={handleChatMobileBack}>
                          <ArrowBackIcon />
                        </IconButton>
                    ) : null}
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
                        <Chip
                            size="small"
                            label="Đang nhắn tin"
                            color="success"
                            variant="outlined"
                            sx={{
                              height: 26,
                              borderColor: alpha(theme.palette.success.main, 0.55),
                              color: 'success.light',
                            }}
                        />
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
                        {activeListingThumb ? (
                            <Box
                                component="img"
                                src={activeListingThumb}
                                alt={activeSession.listingTitle || 'Ảnh tin đăng'}
                                sx={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 1.5,
                                  objectFit: 'cover',
                                  border: '1px solid',
                                  borderColor: alpha(theme.palette.primary.main, 0.35),
                                  flexShrink: 0,
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 1.5,
                                  display: 'grid',
                                  placeItems: 'center',
                                  border: '1px dashed',
                                  borderColor: alpha(theme.palette.primary.main, 0.4),
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  flexShrink: 0,
                                }}
                            >
                              <StorefrontOutlinedIcon color="primary" />
                            </Box>
                        )}
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

                  {/* Messages — cuộn trong khung; nút “Mới nhất” nổi phía trên (không cuộn theo nội dung) */}
                  <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                  >
                    <Box
                        ref={messagesScrollRef}
                        onScroll={updateJumpToLatestVisibility}
                        sx={{
                          flex: 1,
                          overflow: 'auto',
                          overscrollBehavior: 'contain',
                          p: 2,
                          bgcolor:
                              theme.palette.mode === 'dark'
                                  ? alpha(theme.palette.common.black, 0.22)
                                  : alpha(theme.palette.grey[500], 0.06),
                          backgroundImage:
                              theme.palette.mode === 'dark'
                                  ? 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)'
                                  : 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                          scrollbarWidth: 'thin',
                          scrollbarColor: `${alpha(theme.palette.primary.main, 0.42)} ${alpha(theme.palette.common.white, 0.06)}`,
                          '&::-webkit-scrollbar': {
                            width: 10,
                          },
                          '&::-webkit-scrollbar-track': {
                            background: alpha(theme.palette.common.white, 0.04),
                            borderRadius: 999,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: alpha(theme.palette.primary.main, 0.48),
                            borderRadius: 999,
                            border: `2px solid ${alpha(theme.palette.background.paper, 0.72)}`,
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: alpha(theme.palette.primary.light, 0.66),
                          },
                        }}
                    >
                      {historyLoading ? (
                          <Box display="flex" justifyContent="center" py={2}>
                            <CircularProgress size={28} />
                          </Box>
                      ) : displayMessages.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                            <LightbulbOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7, mb: 1 }} />
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              Bắt đầu hội thoại
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
                              Dòng <strong>gợi ý nhanh</strong> ngay trên ô nhập nhắc bạn có thể bấm icon <strong>bóng đèn</strong> để chọn câu gửi
                              ngay. Hoặc gõ tin trực tiếp ở ô bên dưới.
                            </Typography>
                          </Box>
                      ) : (
                          displayMessages.map((m, idx) => {
                            const msgIsMe = isMessageFromCurrentUser(m, currentUserId);
                            const prev = idx > 0 ? displayMessages[idx - 1] : null;
                            const showDay =
                                idx === 0 || !sameCalendarDayVi(prev?.timestamp, m.timestamp);
                            const mid = m?.id != null ? String(m.id) : null;
                            const isHighlighted = mid != null && String(highlightedMessageId) === mid;
                            return (
                                <Fragment key={getMessageRowKey(m, idx)}>
                                  {showDay && m.timestamp && (
                                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                        <Chip
                                            size="small"
                                            label={formatChatDayLabel(m.timestamp)}
                                            sx={{
                                              bgcolor: alpha(theme.palette.primary.main, 0.18),
                                              color: 'text.secondary',
                                              border: '1px solid',
                                              borderColor: alpha(theme.palette.primary.main, 0.35),
                                              fontWeight: 600,
                                              fontSize: '0.7rem',
                                            }}
                                        />
                                      </Box>
                                  )}
                                  <div id={getMessageDomId(mid)}>
                                    <Bubble
                                        msg={{ ...m, isFromCurrentUser: msgIsMe, _highlighted: isHighlighted }}
                                        onAccept={handleAccept}
                                        onReject={handleReject}
                                        onReply={handleReplyMessage}
                                        onJumpToMessage={handleJumpToMessage}
                                        onReportMessage={handleReportMessage}
                                    />
                                  </div>
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

                    {newOpponentMsgCount > 0 && showJumpToLatest && !historyLoading && (
                        <Box
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              bottom: 58,
                              zIndex: 2,
                              pointerEvents: 'none',
                            }}
                        >
                          <Chip
                              label="Tin nhắn mới!"
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 700, boxShadow: 2 }}
                          />
                        </Box>
                    )}

                    {showJumpToLatest && !historyLoading && messages.length > 0 && (
                        <Tooltip
                            title={
                              newOpponentMsgCount > 0
                                  ? `${newOpponentMsgCount} tin mới từ đối phương`
                                  : 'Xuống tin mới nhất'
                            }
                            placement="left"
                        >
                          <Badge
                              badgeContent={newOpponentMsgCount > 0 ? newOpponentMsgCount : 0}
                              color="error"
                              overlap="circular"
                              invisible={newOpponentMsgCount === 0}
                              sx={{
                                position: 'absolute',
                                bottom: 12,
                                right: 16,
                                zIndex: 5,
                                '& .MuiBadge-badge': {
                                  fontWeight: 700,
                                  minWidth: 18,
                                  zIndex: 6,
                                  top: 6,
                                  right: 6,
                                  boxShadow: (t) => `0 0 0 2px ${t.palette.background.paper}`,
                                },
                              }}
                          >
                            <Fab
                                size="small"
                                color="primary"
                                aria-label="Xuống tin mới nhất"
                                onClick={() => scrollToBottom('smooth')}
                                sx={{ boxShadow: 3, zIndex: 4 }}
                            >
                              <KeyboardArrowDownIcon />
                            </Fab>
                          </Badge>
                        </Tooltip>
                    )}
                  </Box>

                  {/* Ô nhập + tiện ích (ảnh, trả giá, gợi ý bóng đèn) */}
                  <Box
                      sx={{
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.88 : 0.98),
                      }}
                  >
                    {composerRef && (
                        <Box
                            sx={{
                              mx: 1.5,
                              mt: 1,
                              px: 1.25,
                              py: 0.75,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: alpha(theme.palette.primary.main, 0.35),
                              bgcolor: alpha(theme.palette.primary.main, 0.06),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                        >
                          <Typography variant="caption" sx={{ minWidth: 0 }}>
                            Nhắc lại {composerRef.senderName}: {(composerRef.content || '').slice(0, 80)}
                          </Typography>
                          <Button size="small" onClick={() => setComposerRef(null)}>Bỏ</Button>
                        </Box>
                    )}
                    <Box
                        sx={{
                          mx: 1.5,
                          mt: composerRef ? 0.75 : 1,
                          mb: 0.5,
                          px: 1.25,
                          py: 0.75,
                          borderRadius: 2,
                          border: '1px dashed',
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                        }}
                    >
                      <LightbulbOutlinedIcon
                          color="primary"
                          sx={{ fontSize: 20, mt: 0.15, flexShrink: 0, opacity: 0.95 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                        <Box component="span" fontWeight={700} color="primary.light" sx={{ mr: 0.5 }}>
                          Gợi ý nhanh
                        </Box>
                        : chọn câu mẫu để gửi ngay.
                      </Typography>
                    </Box>
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
                          p: 1.1,
                          borderRadius: 2.5,
                          border: 1,
                          borderColor: 'divider',
                          bgcolor:
                              theme.palette.mode === 'dark'
                                  ? alpha(theme.palette.common.white, 0.05)
                                  : alpha(theme.palette.common.white, 0.95),
                          boxShadow: theme.palette.mode === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : '0 8px 20px rgba(15,23,42,0.06)',
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
                        <Tooltip title={suggestAnchorEl ? 'Đóng gợi ý nhanh' : 'Mở gợi ý nhanh — chọn câu gửi ngay'}>
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
        </Box>

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
            PaperProps={{
              sx: {
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.26),
                bgcolor: alpha(theme.palette.background.paper, 0.98),
                backgroundImage:
                    'radial-gradient(800px 260px at 50% -120px, rgba(168,85,247,0.18), transparent 65%)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 30px 70px rgba(2,6,23,0.55)',
                overflow: 'hidden',
              },
            }}
        >
          <IconButton
              aria-label="Đóng"
              onClick={() => setOfferOpen(false)}
              sx={{ position: 'absolute', top: 10, right: 10, color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <DialogTitle sx={{ pb: 0.5, pt: 2.5 }}>
            <Stack spacing={1} alignItems="center">
              <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.22),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.38),
                  }}
              >
                <MonetizationOnIcon color="primary" />
              </Box>
              <Typography variant="h5" fontWeight={800}>
                Đề xuất giá
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 320 }}>
                Nhập số tiền bạn muốn đề xuất cho sản phẩm này.
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700, letterSpacing: 0.8, color: 'text.secondary' }}>
              SỐ TIỀN ĐỀ XUẤT
            </Typography>
            <TextField
                autoFocus
                fullWidth
                id="chat-offer-price"
                name="offer_price_custom"
                placeholder="0"
                value={offerAmount}
                onChange={(e) => setOfferAmount(String(e.target.value || '').replace(/[^\d]/g, ''))}
                type="text"
                autoComplete="off"
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  autoComplete: 'off',
                  spellCheck: 'false',
                  autoCorrect: 'off',
                  autoCapitalize: 'off',
                  'aria-autocomplete': 'none',
                  'data-lpignore': 'true',
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.25,
                    fontSize: '1.9rem',
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.common.black, 0.18),
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.55),
                    },
                    '&.Mui-focused fieldset': {
                      borderWidth: 1.5,
                      borderColor: alpha(theme.palette.primary.light, 0.95),
                    },
                  },
                  '& .MuiOutlinedInput-input:focus': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                  '& .MuiOutlinedInput-input': {
                    caretColor: theme.palette.primary.light,
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield',
                  },
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                }}
                helperText={formattedOfferAmount ? `Đề xuất của bạn: ${formattedOfferAmount}` : 'Nhập số tiền lớn hơn 0'}
            />
            {formattedListingPrice && (
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75, mb: 0.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    Giá gốc: {formattedListingPrice}
                  </Typography>
                </Stack>
            )}
            {quickOfferSuggestions.length > 0 && (
                <>
                  <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mt: 2.25, mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8, color: 'text.secondary' }}>
                      GỢI Ý NHANH
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                    {quickOfferSuggestions.map((amount) => (
                        <Chip
                            key={amount}
                            label={`${Math.round(amount / 1000)}k`}
                            clickable
                            onClick={() => setOfferAmount(String(amount))}
                            color={parsedOfferAmount === amount ? 'primary' : 'default'}
                            variant={parsedOfferAmount === amount ? 'filled' : 'outlined'}
                        />
                    ))}
                  </Stack>
                </>
            )}
            <Button
                fullWidth
                variant="contained"
                onClick={submitOffer}
                disabled={!canSubmitOffer}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  py: 1.15,
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #a78bfa 0%, #b794f4 100%)',
                  color: '#17142a',
                  boxShadow: '0 10px 24px rgba(168,85,247,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #c4b5fd 0%, #c084fc 100%)',
                  },
                }}
            >
              Gửi đề xuất
            </Button>
            <Button
                fullWidth
                onClick={() => {
                  setOfferOpen(false);
                  setOfferAmount('');
                }}
                sx={{ mt: 1, textTransform: 'none', color: 'text.secondary', fontWeight: 700 }}
            >
              Hủy
            </Button>

            <Divider sx={{ my: 2 }} />
            <Paper
                variant="outlined"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: alpha(theme.palette.common.black, 0.12),
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                }}
            >
              {activeListingThumb ? (
                  <Box
                      component="img"
                      src={activeListingThumb}
                      alt={activeSession?.listingTitle || 'Ảnh sản phẩm'}
                      sx={{ width: 42, height: 42, borderRadius: 1.2, objectFit: 'cover' }}
                  />
              ) : (
                  <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 1.2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                      }}
                  >
                    <StorefrontOutlinedIcon color="primary" fontSize="small" />
                  </Box>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {activeSession?.listingTitle || 'Sản phẩm đang trao đổi'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  Người bán: {activeSession?.otherParticipantName || 'Đang cập nhật'}
                </Typography>
              </Box>
            </Paper>
          </DialogContent>
        </Dialog>
      </Box>
  );
}

export default function ChatPage() {
  return (
      <ThemeProvider theme={chatDarkTheme}>
        <ChatPageInner />
      </ThemeProvider>
  );
}
