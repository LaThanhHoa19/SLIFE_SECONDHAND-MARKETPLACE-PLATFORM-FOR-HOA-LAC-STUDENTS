/**
 * Trang tin nhắn: danh sách hội thoại và khung chat thời gian thực.
 * UX kiểu marketplace: gợi ý nhanh, tin đang trao đổi, nhóm theo ngày.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { chatDarkTheme } from '../../theme/chatDarkTheme';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';
import { useToast } from '../../context/ToastContext';
import ChatSidebar from './components/ChatSidebar';
import ListingContextBanner from './components/ListingContextBanner';
import OfferDialog from './components/OfferDialog';
import ChatHeader from './components/ChatHeader';
import MessageComposer from './components/MessageComposer';
import ChatMessagesPanel from './components/ChatMessagesPanel';
import { useChatSessions } from './hooks/useChatSessions';
import { useChatRealtime } from './hooks/useChatRealtime';
import {
  CHAT_NEAR_BOTTOM_PX,
  enrichMessagesForDisplay,
  formatSessionTimeShort,
  getData,
  getMessageDomId,
  isMessageFromCurrentUser,
  makeTempId,
  upsertMessages,
} from './chatMessageUtils';
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
  const [activeSessionId, setActiveSessionId] = useState(sessionIdFromUrl || null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionsVersion, setSessionsVersion] = useState(0);
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
  /** Anchor Popover gợi ý — null = đóng (dùng state để Popover mở đúng sau khi nút mount) */
  const [suggestAnchorEl, setSuggestAnchorEl] = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
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
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [newOpponentMsgCount, setNewOpponentMsgCount] = useState(0);

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

  const {
    sessions,
    sessionsLoading,
    activeSession,
    activeListingThumb,
    activeListingPrice,
    isSellerInActiveChat,
    suggestedChatPhrases,
    fetchSessions,
    scheduleFetchSessions,
  } = useChatSessions({
    activeSessionId,
    currentUserId,
    sessionsVersion,
  });

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

  useEffect(() => {
    if (!activeSessionId) return;
    chatApi.markSessionRead(activeSessionId).catch(() => {});
  }, [activeSessionId]);

  const { wsConnected, typingLabel, stopTyping, handleInputChange } = useChatRealtime({
    activeSessionId,
    currentUser,
    authToken,
    fetchHistory,
    scheduleFetchSessions,
    setMessages,
    setInputText,
  });

  /**
   * WS chỉ subscribe đúng 1 session — preview các cuộc khác vẫn cần REST.
   * Luôn poll nhẹ danh sách; khi WS mở vẫn gọi scheduleFetchSessions khi có tin (nhanh hơn).
   */
  useEffect(() => {
    const ms = wsConnected ? 12000 : 8000;
    const id = window.setInterval(fetchSessions, ms);
    return () => window.clearInterval(id);
  }, [wsConnected, fetchSessions]);

  // Poll message history every 3 s only when WS is disconnected.
  useEffect(() => {
    if (!activeSessionId || wsConnected) return;
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [activeSessionId, fetchHistory, wsConnected]);

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

  /** Một lượt trả giá PENDING / chưa kết thúc từ phía mình — khớp rule BE (1 pending / tin / người mua). */
  const hasOpenOfferAwaitingSeller = useMemo(() => {
    if (isSellerInActiveChat) return false;
    return messages.some(
        (m) =>
            m.messageType === 'OFFER_PROPOSAL' &&
            isMessageFromCurrentUser(m, currentUserId) &&
            m.offerId != null &&
            m.offerStatus !== 'ACCEPTED' &&
            m.offerStatus !== 'REJECTED',
    );
  }, [messages, currentUserId, isSellerInActiveChat]);

  const priceOfferDisabled =
      Boolean(activeSessionId) && (isSellerInActiveChat || hasOpenOfferAwaitingSeller);
  const priceOfferTooltip = !activeSessionId
      ? 'Trả giá / đề xuất giá'
      : isSellerInActiveChat
          ? 'Chỉ người mua mới có thể trả giá'
          : hasOpenOfferAwaitingSeller
              ? 'Đang có lượt trả giá chờ người bán — chờ chấp nhận hoặc từ chối rồi mới gửi lượt mới'
              : 'Trả giá / đề xuất giá';

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
          <ChatSidebar
              theme={theme}
              listDisplay={listDisplay}
              sessionsLoading={sessionsLoading}
              sessions={sessions}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
              navigate={navigate}
              formatSessionTimeShort={formatSessionTimeShort}
          />

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
                  <ChatHeader
                      theme={theme}
                      isMdUp={isMdUp}
                      handleChatMobileBack={handleChatMobileBack}
                      activeSession={activeSession}
                      isSellerInActiveChat={isSellerInActiveChat}
                      wsConnected={wsConnected}
                  />

                  {/* Tin đang trao đổi (giống banner chợ) */}
                  <ListingContextBanner
                      theme={theme}
                      activeSession={activeSession}
                      activeListingThumb={activeListingThumb}
                  />

                  <ChatMessagesPanel
                      theme={theme}
                      messagesScrollRef={messagesScrollRef}
                      updateJumpToLatestVisibility={updateJumpToLatestVisibility}
                      historyLoading={historyLoading}
                      displayMessages={displayMessages}
                      currentUserId={currentUserId}
                      highlightedMessageId={highlightedMessageId}
                      handleAccept={handleAccept}
                      handleReject={handleReject}
                      handleReplyMessage={handleReplyMessage}
                      handleJumpToMessage={handleJumpToMessage}
                      handleReportMessage={handleReportMessage}
                      typingLabel={typingLabel}
                      bottomRef={bottomRef}
                      newOpponentMsgCount={newOpponentMsgCount}
                      showJumpToLatest={showJumpToLatest}
                      messages={messages}
                      scrollToBottom={scrollToBottom}
                  />

                  <MessageComposer
                      theme={theme}
                      composerRef={composerRef}
                      setComposerRef={setComposerRef}
                      suggestAnchorEl={suggestAnchorEl}
                      setSuggestAnchorEl={setSuggestAnchorEl}
                      suggestedChatPhrases={suggestedChatPhrases}
                      sending={sending}
                      handleSend={handleSend}
                      fileInputRef={fileInputRef}
                      handleFileChange={handleFileChange}
                      imageUploading={imageUploading}
                      activeSessionId={activeSessionId}
                      setOfferOpen={setOfferOpen}
                      priceOfferDisabled={priceOfferDisabled}
                      priceOfferTooltip={priceOfferTooltip}
                      suggestBtnRef={suggestBtnRef}
                      inputRef={inputRef}
                      inputText={inputText}
                      handleInputChange={handleInputChange}
                  />
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

        <OfferDialog
            open={offerOpen}
            onClose={() => {
              setOfferOpen(false);
              setOfferAmount('');
            }}
            theme={theme}
            offerAmount={offerAmount}
            setOfferAmount={setOfferAmount}
            formattedOfferAmount={formattedOfferAmount}
            formattedListingPrice={formattedListingPrice}
            quickOfferSuggestions={quickOfferSuggestions}
            parsedOfferAmount={parsedOfferAmount}
            canSubmitOffer={canSubmitOffer}
            submitOffer={submitOffer}
            activeListingThumb={activeListingThumb}
            activeSession={activeSession}
        />
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
