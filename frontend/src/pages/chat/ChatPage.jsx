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
  Divider,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { chatDarkTheme } from '../../theme/chatDarkTheme';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useAuth } from '../../hooks/useAuth';
import * as chatApi from '../../api/chatApi';
import { getListing, hideListing } from '../../api/listingApi';
import {
  sealListingDeal,
  buyerAcceptPendingDeal,
  buyerRejectPendingDeal,
} from '../../api/dealApi';
import { useToast } from '../../context/ToastContext';
import { useBlockActions } from '../../hooks/useBlockActions';
import BlockUserConfirmDialog from '../../components/social/BlockUserConfirmDialog';
import { fullImageUrl } from '../../utils/constants';
import ChatSidebar from './components/ChatSidebar';
import ListingContextBanner from './components/ListingContextBanner';
import OfferDialog from './components/OfferDialog';
import ChatHeader from './components/ChatHeader';
import MessageComposer from './components/MessageComposer';
import ChatMessagesPanel from './components/ChatMessagesPanel';
import ChatSearchInConversationDialog from './components/ChatSearchInConversationDialog';
import { useChatSessions } from './hooks/useChatSessions';
import { useChatRealtime } from './hooks/useChatRealtime';
import {
  CHAT_HISTORY_PAGE_SIZE,
  CHAT_LOAD_OLDER_THRESHOLD_PX,
  CHAT_NEAR_BOTTOM_PX,
  enrichMessagesForDisplay,
  formatSessionTimeShort,
  getData,
  markOfferSupersededByDealSeal,
  mergeChatHistoryPage,
  getMessageDomId,
  isMessageFromCurrentUser,
  makeTempId,
  parseChatHistoryResponse,
  upsertMessages,
} from './chatMessageUtils';
// ── main component ────────────────────────────────────────────────────────────

function ChatPageInner() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const { user: currentUser, token: authToken } = useAuth();
  const { showToast } = useToast();
  const { blockUserById } = useBlockActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const messageIdFromUrl = searchParams.get('messageId');
  const listingIdFromUrlRaw = searchParams.get('listingId');
  const listingIdFromUrl =
    listingIdFromUrlRaw && /^\d+$/.test(listingIdFromUrlRaw) ? Number(listingIdFromUrlRaw) : null;
  const currentUserId = currentUser?.id ?? currentUser?.user_id;

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeSessionId, setActiveSessionId] = useState(sessionIdFromUrl || null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  /** Còn trang cũ hơn để tải khi cuộn lên (theo phân trang BE). */
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [nextHistoryPage, setNextHistoryPage] = useState(1);
  const [loadingOlderHistory, setLoadingOlderHistory] = useState(false);
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [chatBlockDialogOpen, setChatBlockDialogOpen] = useState(false);
  const [bubbleSearchHighlight, setBubbleSearchHighlight] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionsVersion, setSessionsVersion] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [composerRef, setComposerRef] = useState(null);
  const [activeListingStatus, setActiveListingStatus] = useState(null);
  /** Mở từ tin đăng: xem trước UI, chưa tạo phiên chat trên server cho đến khi gửi tin đầu tiên */
  const [draftListing, setDraftListing] = useState(null);
  const [draftListingLoading, setDraftListingLoading] = useState(false);
  const [draftListingError, setDraftListingError] = useState(false);

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
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizeListing, setFinalizeListing] = useState(null);
  const [finalizeListingLoading, setFinalizeListingLoading] = useState(false);
  const [finalizePriceText, setFinalizePriceText] = useState('');
  const [finalizePickupTimeLocal, setFinalizePickupTimeLocal] = useState('');
  const [finalizePickupLocationText, setFinalizePickupLocationText] = useState('');

  // UI tokens (tham khảo DealDetailPage)
  const DEAL_UI = useMemo(
    () => ({
      bg: '#201D26',
      surface: '#312F37',
      surfaceHover: '#3a3845',
      accent: theme.palette.primary.main,
      accentHover: alpha(theme.palette.primary.main, 0.85),
      text: theme.palette.common.white,
      textMuted: 'rgba(255,255,255,0.62)',
      border: 'rgba(255,255,255,0.10)',
    }),
    [theme.palette.common.white, theme.palette.primary.main],
  );

  const DEAL_FONT = useMemo(
    () => ({
      input: '14px',
      label: '12px',
      title: '14px',
      help: '13px',
    }),
    [],
  );

  const fmtPrice = useCallback((val) => {
    if (val == null || val === '') return '—';
    const n = Number(val);
    if (!Number.isFinite(n)) return '—';
    return `${n.toLocaleString('vi-VN')} ₫`;
  }, []);

  const toDatetimeLocal = useCallback((val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  const fmtDatetime = useCallback((val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d)) return '—';
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }, []);

  const fmtAddress = useCallback((pickupAddress) => {
    if (!pickupAddress) return '—';
    const parts = [pickupAddress.locationName, pickupAddress.addressText].filter(Boolean);
    return parts.join(' — ') || '—';
  }, []);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const suggestBtnRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const messagesRef = useRef(messages);
  const activeListingStatusRef = useRef(null);
  const finalizeInitializedRef = useRef(false);
  /** Snapshot danh sách tin để diff tin mới từ đối phương khi không ở đáy */
  const prevMessagesForDiffRef = useRef([]);
  /** Bỏ qua một lần diff sau khi mình vừa gửi (fetchHistory / setMessages) để không cộng nhầm */
  const suppressOpponentDiffRef = useRef(false);
  /** Sau đổi session: cuộn đáy đồng bộ trong layout (trước khi đếm tin mới — tránh scrollTop=0 nhầm là đang xem lịch sử) */
  const didInitialScrollForSessionRef = useRef(false);
  const historyScrollRestoreRef = useRef(null);
  const olderLoadInFlightRef = useRef(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [newOpponentMsgCount, setNewOpponentMsgCount] = useState(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const displayMessages = useMemo(
    () => markOfferSupersededByDealSeal(enrichMessagesForDisplay(messages)),
    [messages],
  );

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

  const loadOlderMessages = useCallback(async () => {
    if (!activeSessionId || !historyHasMore || olderLoadInFlightRef.current) return;
    const el = messagesScrollRef.current;
    if (!el || messagesRef.current.length === 0) return;
    olderLoadInFlightRef.current = true;
    setLoadingOlderHistory(true);
    const prevMetrics = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
    const pageToLoad = nextHistoryPage;
    try {
      const res = await chatApi.getHistory(activeSessionId, pageToLoad, CHAT_HISTORY_PAGE_SIZE);
      const { content, last } = parseChatHistoryResponse(res);
      const olderAsc = Array.isArray(content) ? [...content].reverse() : [];
      if (olderAsc.length === 0) {
        setHistoryHasMore(false);
        return;
      }
      suppressOpponentDiffRef.current = true;
      let appended = 0;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => String(m?.id)));
        const merged = olderAsc.filter((m) => m != null && m.id != null && !ids.has(String(m.id)));
        appended = merged.length;
        if (merged.length === 0) return prev;
        historyScrollRestoreRef.current = prevMetrics;
        return [...merged, ...prev];
      });
      if (appended === 0) setHistoryHasMore(false);
      else {
        setHistoryHasMore(!last);
        setNextHistoryPage((p) => p + 1);
      }
    } catch {
      /* giữ nguyên danh sách */
    } finally {
      olderLoadInFlightRef.current = false;
      setLoadingOlderHistory(false);
    }
  }, [activeSessionId, historyHasMore, nextHistoryPage]);

  const handleMessagesScroll = useCallback(() => {
    updateJumpToLatestVisibility();
    const el = messagesScrollRef.current;
    if (!el || historyLoading || loadingOlderHistory || !historyHasMore) return;
    if (el.scrollTop > CHAT_LOAD_OLDER_THRESHOLD_PX) return;
    loadOlderMessages();
  }, [
    updateJumpToLatestVisibility,
    historyLoading,
    loadingOlderHistory,
    historyHasMore,
    loadOlderMessages,
  ]);

  useLayoutEffect(() => {
    const snap = historyScrollRestoreRef.current;
    if (snap == null) return;
    historyScrollRestoreRef.current = null;
    const el = messagesScrollRef.current;
    if (!el) return;
    const delta = el.scrollHeight - snap.scrollHeight;
    el.scrollTop = snap.scrollTop + delta;
  }, [messages]);

  useEffect(() => {
    setNewOpponentMsgCount(0);
    prevMessagesForDiffRef.current = [];
    didInitialScrollForSessionRef.current = false;
    setHighlightedMessageId(null);
    setHistoryHasMore(false);
    setNextHistoryPage(1);
    setLoadingOlderHistory(false);
    olderLoadInFlightRef.current = false;
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
    if (sessionIdFromUrl && listingIdFromUrl) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('listingId');
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    }
  }, [sessionIdFromUrl, listingIdFromUrl, setSearchParams]);

  useEffect(() => {
    if (!listingIdFromUrl || sessionIdFromUrl) {
      setDraftListing(null);
      setDraftListingError(false);
      setDraftListingLoading(false);
      return;
    }
    let cancelled = false;
    setDraftListingLoading(true);
    setDraftListingError(false);
    getListing(listingIdFromUrl)
      .then((res) => {
        const body = res?.data;
        const data = body?.data ?? body;
        if (!cancelled) setDraftListing(data ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setDraftListing(null);
          setDraftListingError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setDraftListingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingIdFromUrl, sessionIdFromUrl]);

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
    sessionsTotalElements,
    sidebarSearch,
    setSidebarSearch,
    sidebarSearchForHighlight,
    activeSession: sessionFromList,
    activeListingThumb: listingThumbFromList,
    activeListingPrice: listingPriceFromList,
    activeListingIsGiveaway: listingIsGiveawayFromSession,
    suggestedChatPhrases,
    fetchSessions,
    scheduleFetchSessions,
    listingUnavailableByListingId,
  } = useChatSessions({
    activeSessionId,
    currentUserId,
    sessionsVersion,
  });

  /** Đồng bộ URL + state khi đã biết sessionUuid (phiên có sẵn hoặc vừa tạo sau tin đầu). */
  const promoteUrlToSession = useCallback(
    (sessionId) => {
      if (!sessionId) return;
      setActiveSessionId(sessionId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('listingId');
          next.set('sessionId', sessionId);
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
      setDraftListing(null);
      setDraftListingError(false);
      setDraftListingLoading(false);
    },
    [setSearchParams]
  );

  /**
   * Mở từ listing (?listingId=) nhưng đã có hội thoại → gắn sessionId ngay để load history,
   * tránh panel trắng đến khi gửi tin mới.
   */
  useEffect(() => {
    if (!listingIdFromUrl || sessionIdFromUrl) return;
    if (sessionsLoading) return;
    if (!Array.isArray(sessions) || sessions.length === 0) return;

    const lid = Number(listingIdFromUrl);
    const candidates = sessions.filter((s) => s && Number(s.listingId) === lid);
    if (candidates.length === 0) return;

    const byLast = (a, b) => {
      const ta = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    };

    const uid = currentUserId != null ? Number(currentUserId) : NaN;
    let chosen = null;
    if (Number.isFinite(uid)) {
      const asBuyer = candidates.filter((s) => Number(s.buyerId) === uid);
      if (asBuyer.length === 1) chosen = asBuyer[0];
      else if (asBuyer.length > 1) chosen = [...asBuyer].sort(byLast)[0];
      else {
        const asSeller = candidates.filter((s) => Number(s.sellerId) === uid);
        if (asSeller.length === 1) chosen = asSeller[0];
        else if (asSeller.length > 1) chosen = [...asSeller].sort(byLast)[0];
      }
    }
    if (!chosen) {
      chosen = candidates.length === 1 ? candidates[0] : [...candidates].sort(byLast)[0];
    }

    const sid = chosen?.sessionId;
    if (!sid) return;
    promoteUrlToSession(sid);
  }, [
    listingIdFromUrl,
    sessionIdFromUrl,
    sessionsLoading,
    sessions,
    currentUserId,
    promoteUrlToSession,
  ]);

  const activeSession = useMemo(() => {
    if (activeSessionId && sessionFromList) return sessionFromList;
    if (!activeSessionId && listingIdFromUrl && draftListing && !draftListingError) {
      const seller = draftListing.seller || draftListing.sellerSummary;
      const sellerId = seller?.id ?? seller?.userId ?? null;
      return {
        sessionId: null,
        listingId: draftListing.id,
        listingTitle: draftListing.title,
        buyerId: currentUserId,
        sellerId,
        otherParticipantName:
          seller?.fullName || seller?.name || seller?.displayName || 'Người bán',
        otherParticipantAvatarUrl:
          seller?.avatarUrl ||
          seller?.sellerAvatarUrl ||
          seller?.avatar_url ||
          null,
        status: 'DRAFT',
      };
    }
    return sessionFromList;
  }, [
    activeSessionId,
    sessionFromList,
    listingIdFromUrl,
    draftListing,
    draftListingError,
    currentUserId,
  ]);

  const activeListingThumb = useMemo(() => {
    if (!activeSessionId && listingIdFromUrl && draftListing) {
      const raw = Array.isArray(draftListing.images) ? draftListing.images[0] : null;
      return fullImageUrl(raw);
    }
    return listingThumbFromList;
  }, [activeSessionId, listingIdFromUrl, draftListing, listingThumbFromList]);

  const activeListingPrice = useMemo(() => {
    if (!activeSessionId && listingIdFromUrl && draftListing && draftListing.price != null) {
      return Number(draftListing.price);
    }
    return listingPriceFromList;
  }, [activeSessionId, listingIdFromUrl, draftListing, listingPriceFromList]);

  /** Tin cho tặng / 0đ — người mua không cần (và không nên) mở hộp trả giá. */
  const listingIsFreeOrGiveaway = useMemo(() => {
    const gw =
      Boolean(listingIsGiveawayFromSession) ||
      Boolean(draftListing?.isGiveaway) ||
      Boolean(finalizeListing?.isGiveaway);
    const pr = activeListingPrice;
    const zero = Number.isFinite(pr) && pr <= 0;
    return gw || zero;
  }, [
    listingIsGiveawayFromSession,
    draftListing?.isGiveaway,
    finalizeListing?.isGiveaway,
    activeListingPrice,
  ]);

  const isSellerInActiveChat = useMemo(() => {
    if (!activeSession || currentUserId == null) return false;
    return Number(activeSession.sellerId) === Number(currentUserId);
  }, [activeSession, currentUserId]);

  /** Đối phương trong phiên (để chặn) — gồm cả draft chat từ listingId. */
  const chatBlockTargetUserId = useMemo(() => {
    if (!activeSession || currentUserId == null) return null;
    const me = Number(currentUserId);
    const bid = activeSession.buyerId != null ? Number(activeSession.buyerId) : NaN;
    const sid = activeSession.sellerId != null ? Number(activeSession.sellerId) : NaN;
    if (!Number.isFinite(me)) return null;
    const isDraft = !activeSession.sessionId || activeSession.status === 'DRAFT';
    if (isDraft) {
      if (Number.isFinite(sid) && sid !== me) return sid;
      return null;
    }
    if (Number.isFinite(bid) && bid === me && Number.isFinite(sid)) return sid;
    if (Number.isFinite(sid) && sid === me && Number.isFinite(bid)) return bid;
    return null;
  }, [activeSession, currentUserId]);

  const hydrateSessionFromFirstMessage = useCallback(
    (msgPayload) => {
      const sid = msgPayload?.sessionId;
      if (!sid) return;
      promoteUrlToSession(sid);
      setSessionsVersion((v) => v + 1);
    },
    [promoteUrlToSession]
  );

  useEffect(() => {
    activeListingStatusRef.current = activeListingStatus;
  }, [activeListingStatus]);

  // UI gating: khi tin không còn ACTIVE (ẩn, gỡ, hết hạn, …) — khóa trả giá và đánh dấu trong banner/sidebar.
  // Poll định kỳ; dừng khi đã có trạng thái khác ACTIVE.
  useEffect(() => {
    if (!activeSession?.listingId) {
      setActiveListingStatus(null);
      return;
    }

    let cancelled = false;
    let timerId = null;

    const fetchStatus = async () => {
      try {
        const res = await getListing(activeSession.listingId);
        const body = res?.data;
        const data = body?.data ?? body;
        const raw = data?.status ?? data?.itemStatus ?? null;
        const status = raw != null ? String(raw).toUpperCase() : null;
        if (!cancelled) setActiveListingStatus(status);
      } catch {
        if (!cancelled) setActiveListingStatus('NOT_FOUND');
      }
    };

    const tick = () => {
      const s = activeListingStatusRef.current;
      if (s != null && String(s).toUpperCase() !== 'ACTIVE') return;
      void fetchStatus();
    };

    void fetchStatus();
    timerId = window.setInterval(tick, 7000);

    return () => {
      cancelled = true;
      if (timerId) window.clearInterval(timerId);
    };
  }, [activeSession?.listingId]);

  // Seller UI: once buyer accepts the "XÁC NHẬN THỎA THUẬN" message, hide "Chốt đơn"
  // and show post-sale actions. Must run after useChatSessions (isSellerInActiveChat).
  const showPostSaleActions = useMemo(() => {
    if (!isSellerInActiveChat) return false;
    for (let i = displayMessages.length - 1; i >= 0; i -= 1) {
      const m = displayMessages[i];
      if (!m) continue;
      if (m.messageType !== 'DEAL_CONFIRMATION') continue;
      if (!isMessageFromCurrentUser(m, currentUserId)) continue; // confirmation request is sent by seller
      const isDealConfirmationRequest =
        typeof m.content === 'string' && m.content.toUpperCase().includes('XÁC NHẬN THỎA THUẬN');
      if (!isDealConfirmationRequest) continue;
      if (m.dealDecision === 'ACCEPT') return true;
    }
    return false;
  }, [displayMessages, currentUserId, isSellerInActiveChat]);

  const [postSaleBannerOutcome, setPostSaleBannerOutcome] = useState(null);
  const [postSaleBannerBusy, setPostSaleBannerBusy] = useState(false);

  useEffect(() => {
    setPostSaleBannerOutcome(null);
    setPostSaleBannerBusy(false);
  }, [activeSessionId]);

  /** Sau F5, postSaleBannerOutcome mất; đồng bộ GET listing (ẩn / mod ẩn / gỡ). */
  const resolvedPostSaleBannerOutcome = useMemo(() => {
    if (postSaleBannerOutcome === 'hidden') return 'hidden';
    const st = String(activeListingStatus || '').toUpperCase();
    if (st === 'HIDDEN' || st === 'MOD_HIDDEN') return 'hidden';
    if (st === 'NOT_FOUND') return 'gone';
    return null;
  }, [postSaleBannerOutcome, activeListingStatus]);

  /** Tin không còn trên chợ — khóa trả giá, không link sang chi tiết tin. */
  const listingInactiveForChat = useMemo(() => {
    const st = String(activeListingStatus || '').toUpperCase();
    if (!st) return false;
    return st !== 'ACTIVE';
  }, [activeListingStatus]);

  /** Nút "Đã bán / ẩn tin": chỉ chuyển tin sang HIDDEN (không gọi markSold). */
  const handlePostSaleBannerAction = useCallback(async () => {
    const id = activeSession?.listingId;
    if (id == null || postSaleBannerBusy) return;
    setPostSaleBannerBusy(true);
    try {
      await hideListing(id);
      showToast('Đã ẩn tin.', 'success');
      setPostSaleBannerOutcome('hidden');
      setActiveListingStatus('HIDDEN');
      fetchSessions();
      setSessionsVersion((v) => v + 1);
    } catch (e) {
      const detail =
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Không thể ẩn tin';
      showToast(detail, 'error');
    } finally {
      setPostSaleBannerBusy(false);
    }
  }, [activeSession?.listingId, fetchSessions, postSaleBannerBusy, showToast]);

  // Xóa tin cũ trước khi paint khi đổi phiên — tránh nháy nội dung chat khác + giảm cảm giác “reload”.
  useLayoutEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setHistoryLoading(false);
      return;
    }
    setMessages([]);
    setHistoryLoading(true);
  }, [activeSessionId, messageIdFromUrl]);

  // ── Fetch message history ─────────────────────────────────────────────────
  const fetchHistory = useCallback(() => {
    if (!activeSessionId) return Promise.resolve();
    return chatApi
      .getHistory(activeSessionId, 0, CHAT_HISTORY_PAGE_SIZE)
      .then((res) => {
        const { content } = parseChatHistoryResponse(res);
        setMessages((prev) => mergeChatHistoryPage(prev, content));
      })
      .catch(() => { });
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        const targetId = messageIdFromUrl ? String(messageIdFromUrl) : null;

        // Bình thường: chỉ lấy page 0.
        if (!targetId) {
          const res = await chatApi.getHistory(activeSessionId, 0, CHAT_HISTORY_PAGE_SIZE);
          if (cancelled) return;
          const { content, last } = parseChatHistoryResponse(res);
          setMessages(Array.isArray(content) ? [...content].reverse() : []);
          setHistoryHasMore(!last);
          setNextHistoryPage(1);
          return;
        }

        // Deep-link: tải thêm trang để tăng khả năng chứa message mục tiêu.
        const maxPagesToScan = 8;
        const aggregated = [];
        let found = false;
        let lastFetchedLast = true;
        let pagesScanned = 0;

        for (let p = 0; p < maxPagesToScan; p += 1) {
          const res = await chatApi.getHistory(activeSessionId, p, CHAT_HISTORY_PAGE_SIZE);
          if (cancelled) return;
          const { content, last } = parseChatHistoryResponse(res);
          lastFetchedLast = last;
          pagesScanned = p + 1;

          if (content.length === 0) break;
          aggregated.push(...content);

          if (content.some((m) => String(m?.id) === targetId)) {
            found = true;
            break;
          }
          if (content.length < CHAT_HISTORY_PAGE_SIZE) break;
        }

        if (cancelled) return;
        const base = aggregated.length > 0 ? aggregated : [];
        setMessages([...base].reverse());
        setNextHistoryPage(pagesScanned);
        setHistoryHasMore(!lastFetchedLast);

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
    chatApi.markSessionRead(activeSessionId).catch(() => { });
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
    if (!text || sending) return;
    if (!activeSessionId && !listingIdFromUrl) return;
    if (!activeSessionId && (draftListingLoading || draftListingError || !draftListing)) return;
    setSending(true);
    setInputText('');
    stopTyping();
    try {
      suppressOpponentDiffRef.current = true;
      const res = await chatApi.sendMessage(activeSessionId || null, text, 'TEXT', null, {
        replyToMessageId: composerRef?.id ?? null,
        quoteMessageId: null,
        listingId: !activeSessionId ? listingIdFromUrl : undefined,
      });
      const msg = getData(res);
      if (!activeSessionId && msg?.sessionId) {
        hydrateSessionFromFirstMessage(msg);
      }
      setComposerRef(null);
      const sidForHistory = msg?.sessionId || activeSessionId;
      if (sidForHistory) {
        try {
          const hres = await chatApi.getHistory(sidForHistory, 0, CHAT_HISTORY_PAGE_SIZE);
          const { content, last } = parseChatHistoryResponse(hres);
          setMessages(Array.isArray(content) ? [...content].reverse() : []);
          setHistoryHasMore(!last);
          setNextHistoryPage(1);
        } catch {
          setMessages([]);
        }
      } else {
        await fetchHistory();
      }
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

  const ensureHistoryContainsMessage = useCallback(async (sessionId, messageId) => {
    const mid = String(messageId);
    if (!sessionId || !mid) return false;
    if (messagesRef.current.some((m) => String(m?.id) === mid)) return true;
    const maxPages = 20;
    const aggregated = [];
    let lastFetchedLast = true;
    let pagesScanned = 0;
    try {
      for (let p = 0; p < maxPages; p += 1) {
        const res = await chatApi.getHistory(sessionId, p, CHAT_HISTORY_PAGE_SIZE);
        const { content, last } = parseChatHistoryResponse(res);
        lastFetchedLast = last;
        pagesScanned = p + 1;
        if (content.length === 0) break;
        aggregated.push(...content);
        if (content.some((m) => String(m?.id) === mid)) break;
        if (content.length < CHAT_HISTORY_PAGE_SIZE) break;
      }
      if (aggregated.length === 0) return false;
      setMessages([...aggregated].reverse());
      setNextHistoryPage(pagesScanned);
      setHistoryHasMore(!lastFetchedLast);
      return aggregated.some((m) => String(m?.id) === mid);
    } catch {
      return false;
    }
  }, []);

  const handleInChatSearchPick = useCallback(
    async (messageId, query) => {
      if (!activeSessionId) return;
      setInChatSearchOpen(false);
      await ensureHistoryContainsMessage(activeSessionId, messageId);
      const qstr = typeof query === 'string' ? query : '';
      setBubbleSearchHighlight({ messageId: String(messageId), query: qstr });
      window.setTimeout(() => {
        const domId = getMessageDomId(messageId);
        if (domId) {
          const el = document.getElementById(domId);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setHighlightedMessageId(String(messageId));
        window.setTimeout(() => setHighlightedMessageId(null), 1800);
        window.setTimeout(() => setBubbleSearchHighlight(null), 4200);
      }, 120);
    },
    [activeSessionId, ensureHistoryContainsMessage],
  );

  useEffect(() => {
    setBubbleSearchHighlight(null);
  }, [activeSessionId]);

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
    setDraftListing(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('sessionId');
        next.delete('messageId');
        next.delete('listingId');
        return next;
      },
      { replace: true, preventScrollReset: true }
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
    if (!previewFile) return;
    if (!activeSessionId && !listingIdFromUrl) return;
    if (!activeSessionId && (draftListingLoading || draftListingError || !draftListing)) return;
    setPreviewOpen(false);
    setImageUploading(true);

    const optimistic = {
      id: makeTempId(),
      _pending: true,
      sessionId: activeSessionId || `draft-${listingIdFromUrl}`,
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
      const uploadRes = await chatApi.uploadChatImage(
        activeSessionId || null,
        previewFile,
        !activeSessionId ? listingIdFromUrl : null
      );
      const fileUrl = getData(uploadRes);
      if (!fileUrl) throw new Error('No URL returned from upload');

      const msgRes = await chatApi.sendMessage(
        activeSessionId || null,
        '[Hình ảnh]',
        'IMAGE',
        fileUrl,
        {
          replyToMessageId: composerRef?.id ?? null,
          quoteMessageId: null,
          listingId: !activeSessionId ? listingIdFromUrl : undefined,
        }
      );
      const msg = getData(msgRes);
      if (!activeSessionId && msg?.sessionId) {
        hydrateSessionFromFirstMessage(msg);
      }
      setComposerRef(null);

      suppressOpponentDiffRef.current = true;
      setMessages((prev) => {
        if (!msg?.id) return prev.filter((m) => !m._pending);
        return upsertMessages(prev, msg, { dropPending: true });
      });
      const sidForHistory = msg?.sessionId || activeSessionId;
      if (sidForHistory) {
        try {
          const hres = await chatApi.getHistory(sidForHistory, 0, CHAT_HISTORY_PAGE_SIZE);
          const { content, last } = parseChatHistoryResponse(hres);
          setMessages(Array.isArray(content) ? [...content].reverse() : []);
          setHistoryHasMore(!last);
          setNextHistoryPage(1);
        } catch {
          /* keep upserted */
        }
      }
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
    if (!amount || amount <= 0) return;
    if (!activeSessionId && !listingIdFromUrl) return;
    if (!activeSessionId && (draftListingLoading || draftListingError || !draftListing)) return;
    setOfferOpen(false);
    setOfferAmount('');
    try {
      suppressOpponentDiffRef.current = true;
      let res;
      if (!activeSessionId && listingIdFromUrl) {
        res = await chatApi.makeOfferByListing(listingIdFromUrl, amount);
      } else {
        res = await chatApi.makeOffer(activeSessionId, amount);
      }
      const msg = getData(res);
      if (!activeSessionId && msg?.sessionId) {
        hydrateSessionFromFirstMessage(msg);
      }
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
          Number(m.offerId) === Number(offerId) ? { ...m, offerStatus: 'ACCEPTED' } : m
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
          Number(m.offerId) === Number(offerId) ? { ...m, offerStatus: 'REJECTED' } : m
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

  const latestPendingOfferIdForSeller = useMemo(() => {
    if (!isSellerInActiveChat) return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (!m) continue;
      if (m.messageType !== 'OFFER_PROPOSAL') continue;
      if (m.offerId == null) continue;
      if (isMessageFromCurrentUser(m, currentUserId)) continue;
      if (m.offerStatus === 'ACCEPTED' || m.offerStatus === 'REJECTED') continue;
      return m.offerId;
    }
    return null;
  }, [messages, currentUserId, isSellerInActiveChat]);

  const pendingOfferForFinalize = useMemo(() => {
    const oid = latestPendingOfferIdForSeller;
    if (!oid) return null;
    return messages.find((m) => m?.messageType === 'OFFER_PROPOSAL' && Number(m.offerId) === Number(oid)) ?? null;
  }, [messages, latestPendingOfferIdForSeller]);

  // If seller already accepted an offer, show that accepted price in the confirm popup.
  const latestAcceptedOfferForFinalize = useMemo(() => {
    if (!isSellerInActiveChat) return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (!m) continue;
      if (m.messageType !== 'OFFER_PROPOSAL') continue;
      if (m.offerStatus !== 'ACCEPTED') continue;
      // Offer proposals come from buyer; guard against picking my own messages.
      if (isMessageFromCurrentUser(m, currentUserId)) continue;
      return m;
    }
    return null;
  }, [messages, currentUserId, isSellerInActiveChat]);

  const offerContentToPriceText = useCallback(
    (text) => {
      if (!text) return null;
      const raw = String(text);
      const digits = raw.replace(/[^\d]/g, '');
      if (!digits) return raw;
      const n = Number(digits);
      if (!Number.isFinite(n)) return raw;
      return fmtPrice(n);
    },
    [fmtPrice],
  );

  useEffect(() => {
    if (!finalizeOpen) return;
    const lid = activeSession?.listingId;
    if (!lid) {
      setFinalizeListing(null);
      return;
    }
    let alive = true;
    setFinalizeListingLoading(true);
    getListing(lid)
      .then((res) => {
        if (!alive) return;
        const body = res?.data;
        const data = body?.data ?? body;
        setFinalizeListing(data ?? null);
      })
      .catch(() => {
        if (!alive) return;
        setFinalizeListing(null);
      })
      .finally(() => {
        if (!alive) return;
        setFinalizeListingLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [finalizeOpen, activeSession?.listingId]);

  // Seed default fields when opening finalize dialog (used for display only)
  useEffect(() => {
    if (!finalizeOpen) {
      finalizeInitializedRef.current = false;
      return;
    }
    if (finalizeInitializedRef.current) return;

    // Wait until the listing is loaded (if expected) before initializing defaults
    const hasLid = Boolean(activeSession?.listingId);
    const listingReady = hasLid ? (finalizeListing && !finalizeListingLoading) : true;

    if (listingReady) {
      // 1. Price
      const offerText = latestAcceptedOfferForFinalize?.content;
      const offerNum = offerText ? Number(String(offerText).replace(/[^\d]/g, '')) : NaN;
      if (Number.isFinite(offerNum) && offerNum >= 0) {
        setFinalizePriceText(String(offerNum));
      } else if (Number.isFinite(activeListingPrice) && activeListingPrice >= 0) {
        setFinalizePriceText(String(Math.round(activeListingPrice)));
      }

      // 2. Time (Default to now + 1h)
      const d = new Date(Date.now() + 60 * 60 * 1000);
      setFinalizePickupTimeLocal(toDatetimeLocal(d.toISOString()));

      // 3. Location (From listing)
      const fromListing = fmtAddress(finalizeListing?.pickupAddress);
      setFinalizePickupLocationText(fromListing && fromListing !== '—' ? fromListing : '');

      finalizeInitializedRef.current = true;
    }
  }, [
    finalizeOpen,
    finalizeListing,
    finalizeListingLoading,
    activeSession?.listingId,
    latestAcceptedOfferForFinalize?.content,
    activeListingPrice,
    toDatetimeLocal,
    fmtAddress,
  ]);

  const listingTitleForFinalize =
    finalizeListing?.title || activeSession?.listingTitle || (activeSession?.listingId ? `Tin #${activeSession.listingId}` : '—');
  const listingPriceForFinalize = finalizeListing?.price ?? activeListingPrice;
  const pickupAddressForFinalize = finalizeListing?.pickupAddress ?? null;

  const latestAcceptedOfferForConfirm = useMemo(() => {
    if (!isSellerInActiveChat) return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (!m) continue;
      if (m.messageType !== 'OFFER_PROPOSAL') continue;
      if (m.offerStatus !== 'ACCEPTED') continue;
      if (isMessageFromCurrentUser(m, currentUserId)) continue;
      return m;
    }
    return null;
  }, [messages, currentUserId, isSellerInActiveChat]);

  const dealPriceTextForConfirm = useMemo(() => {
    const accepted = latestAcceptedOfferForConfirm?.content;
    if (accepted && String(accepted).trim()) {
      return offerContentToPriceText(accepted);
    }
    return fmtPrice(listingPriceForFinalize);
  }, [latestAcceptedOfferForConfirm?.content, fmtPrice, listingPriceForFinalize, offerContentToPriceText]);

  const parseDealPriceNumber = useCallback(
    (priceText) => {
      if (!priceText) return NaN;
      const digits = String(priceText).replace(/[^\d]/g, '');
      if (!digits) return NaN;
      const n = Number(digits);
      return Number.isFinite(n) ? n : NaN;
    },
    [],
  );

  const toIsoFromDatetimeLocal = useCallback((dtLocal) => {
    if (!dtLocal) return null;
    // datetime-local format: YYYY-MM-DDTHH:mm
    const d = new Date(dtLocal);
    if (isNaN(d)) return null;
    return d.toISOString();
  }, []);

  const sendDealConfirmation = useCallback(async () => {
    if (!activeSessionId) return false;
    if (!finalizePickupTimeLocal || !String(finalizePickupTimeLocal).trim()) {
      showToast('Vui lòng chọn thời gian nhận hàng.', 'warning');
      return false;
    }
    const pickupMs = new Date(finalizePickupTimeLocal).getTime();
    if (!Number.isFinite(pickupMs) || pickupMs <= Date.now()) {
      showToast('Thời gian nhận hàng phải sau thời điểm hiện tại.', 'warning');
      return false;
    }
    const title = listingTitleForFinalize || (activeSession?.listingId ? `Tin #${activeSession.listingId}` : 'Tin đăng');
    const when = finalizePickupTimeLocal ? fmtDatetime(finalizePickupTimeLocal) : '—';
    const where =
      (finalizePickupLocationText && String(finalizePickupLocationText).trim()) ||
      fmtAddress(pickupAddressForFinalize) ||
      '—';

    const content = [
      '🧾 XÁC NHẬN THỎA THUẬN',
      '',
      `- Tin đăng: ${title}`,
      `- Giá thỏa thuận: ${dealPriceTextForConfirm}`,
      `- Thời gian nhận hàng: ${when}`,
      `- Địa điểm nhận hàng: ${where}`,
      '',
      'Vui lòng chọn: Chấp nhận hoặc Hủy.',
    ].join('\n');

    try {
      const listingId = activeSession?.listingId;
      const buyerId = activeSession?.buyerId;
      const price = parseDealPriceNumber(dealPriceTextForConfirm);
      if (listingId == null || buyerId == null || !Number.isFinite(price)) {
        showToast('Thiếu thông tin để chốt đơn (tin / người mua / giá).', 'warning');
        return false;
      }
      let resolvedOfferId = null;
      const acceptedOffer = latestAcceptedOfferForConfirm;
      if (acceptedOffer?.offerId != null) {
        const fromAccepted = parseDealPriceNumber(offerContentToPriceText(acceptedOffer.content));
        if (Number.isFinite(fromAccepted) && fromAccepted === price) {
          resolvedOfferId = acceptedOffer.offerId;
        }
      }
      if (resolvedOfferId == null && pendingOfferForFinalize?.offerId != null) {
        const fromPending = parseDealPriceNumber(pendingOfferForFinalize.content);
        if (Number.isFinite(fromPending) && fromPending === price) {
          resolvedOfferId = pendingOfferForFinalize.offerId;
        }
      }
      const pickupIso = toIsoFromDatetimeLocal(finalizePickupTimeLocal);
      const sealAddressId = pickupAddressForFinalize?.addressId ?? pickupAddressForFinalize?.id;
      const pickupLocRaw =
        (finalizePickupLocationText && String(finalizePickupLocationText).trim()) ||
        fmtAddress(pickupAddressForFinalize) ||
        '';
      await sealListingDeal(listingId, {
        buyerId: Number(buyerId),
        price,
        ...(pickupIso ? { pickupTime: pickupIso } : {}),
        ...(resolvedOfferId != null ? { offerId: resolvedOfferId } : {}),
        ...(sealAddressId != null ? { addressId: Number(sealAddressId) } : {}),
        ...(pickupLocRaw && pickupLocRaw !== '—' ? { pickupLocationText: pickupLocRaw } : {}),
      });
      suppressOpponentDiffRef.current = true;
      const res = await chatApi.sendMessage(activeSessionId, content, 'DEAL_CONFIRMATION');
      const msg = getData(res);
      if (msg?.id) setMessages((prev) => upsertMessages(prev, msg, { dropPending: true }));
      fetchSessions();
      scrollToBottom('smooth');
      setNewOpponentMsgCount(0);
      return true;
    } catch (err) {
      const detail = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      showToast(`Chốt đơn thất bại: ${detail}`, 'error');
      return false;
    }
  }, [
    activeSession?.listingId,
    activeSession?.buyerId,
    activeSessionId,
    dealPriceTextForConfirm,
    latestAcceptedOfferForConfirm,
    pendingOfferForFinalize,
    offerContentToPriceText,
    parseDealPriceNumber,
    finalizePickupTimeLocal,
    toIsoFromDatetimeLocal,
    fetchSessions,
    finalizePickupLocationText,
    fmtAddress,
    fmtDatetime,
    getData,
    listingTitleForFinalize,
    pickupAddressForFinalize,
    scrollToBottom,
    showToast,
  ]);

  const handleDealConfirmDecision = useCallback(
    async (confirmMsg, decision) => {
      if (!activeSessionId) return;
      const confirmId = confirmMsg?.id ?? null;

      // Frontend-only: disable actions after choosing once.
      if (confirmId != null) {
        const responderName =
          currentUser?.fullName || currentUser?.name || currentUser?.email || 'Bạn';
        setMessages((prev) =>
          prev.map((m) =>
            String(m?.id) === String(confirmId)
              ? { ...m, dealDecision: decision, dealResponderName: responderName }
              : m,
          ),
        );
      }

      const replyText =
        decision === 'ACCEPT'
          ? '✅ Mình đồng ý với thông tin thỏa thuận trên.'
          : '❌ Mình không đồng ý / hủy thỏa thuận này.';

      try {
        const listingId = activeSession?.listingId;
        if (decision === 'ACCEPT') {
          if (listingId != null) {
            await buyerAcceptPendingDeal(listingId);
          }
        } else if (decision === 'CANCEL' && listingId != null) {
          await buyerRejectPendingDeal(listingId);
        }
        suppressOpponentDiffRef.current = true;
        const res = await chatApi.sendMessage(activeSessionId, replyText, 'TEXT', null, {
          replyToMessageId: confirmId,
        });
        const msg = getData(res);
        if (msg?.id) setMessages((prev) => upsertMessages(prev, msg, { dropPending: true }));
        fetchSessions();
        scrollToBottom('smooth');
      } catch (err) {
        const detail = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
        showToast(`Gửi phản hồi thất bại: ${detail}`, 'error');
      }
    },
    [
      activeSession?.listingId,
      activeSessionId,
      buyerAcceptPendingDeal,
      buyerRejectPendingDeal,
      currentUser,
      fetchSessions,
      scrollToBottom,
      showToast,
    ],
  );

  function FormField({ label, value, icon, multiline = false, inputProps = {}, type }) {
    return (
      <TextField
        label={label}
        value={value ?? '—'}
        size="small"
        fullWidth
        multiline={multiline}
        minRows={multiline ? 2 : undefined}
        type={type}
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: icon ? (
              <InputAdornment position="start">
                <Box sx={{ color: DEAL_UI.textMuted }}>{icon}</Box>
              </InputAdornment>
            ) : undefined,
            ...inputProps,
          },
          inputLabel: { shrink: true },
        }}
        sx={{
          '& .MuiInputBase-root': {
            backgroundColor: DEAL_UI.surface,
            color: DEAL_UI.text,
            fontSize: DEAL_FONT.input,
            borderRadius: '10px',
            cursor: 'default',
          },
          '& .MuiInputBase-input': {
            color: DEAL_UI.text,
            cursor: 'default',
            fontSize: DEAL_FONT.input,
            caretColor: 'transparent',
          },
          '& .MuiInputLabel-root': {
            color: DEAL_UI.textMuted,
            fontSize: DEAL_FONT.label,
          },
          '& .MuiInputLabel-root.Mui-focused': { color: DEAL_UI.accent },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: DEAL_UI.accent,
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: DEAL_UI.accent,
            borderWidth: 1,
          },
        }}
      />
    );
  }

  // Note: popup only previews info; no editing in this screen.

  useEffect(() => {
    if (listingInactiveForChat) setOfferOpen(false);
  }, [listingInactiveForChat]);

  /**
   * Chặn nút trả giá khi còn tin chốt đơn đang chờ mua phản hồi hoặc mua đã chấp nhận.
   * Đã hủy (CANCEL) hoặc phản hồi không phân loại (DONE) → không chặn (chỉ sau ACCEPT mới khóa lâu dài).
   */
  const buyerBlockedByDealSeal = useMemo(() => {
    if (isSellerInActiveChat) return false;
    return displayMessages.some((m) => {
      if (m.messageType !== 'DEAL_CONFIRMATION') return false;
      const c = typeof m.content === 'string' ? m.content : '';
      if (!c.toUpperCase().includes('XÁC NHẬN THỎA THUẬN')) return false;
      if (m.dealDecision === 'CANCEL') return false;
      if (m.dealDecision === 'ACCEPT') return true;
      if (m.dealDecision == null) return true;
      return false;
    });
  }, [displayMessages, isSellerInActiveChat]);

  const draftChatReady =
    Boolean(listingIdFromUrl) && Boolean(draftListing) && !draftListingError && !draftListingLoading;

  const freeListingBuyerHint =
    !isSellerInActiveChat && Boolean(activeSessionId || draftChatReady) && listingIsFreeOrGiveaway;

  const priceOfferDisabled =
    Boolean(activeSessionId || draftChatReady) &&
    (isSellerInActiveChat ||
      hasOpenOfferAwaitingSeller ||
      listingInactiveForChat ||
      buyerBlockedByDealSeal);
  const priceOfferTooltip = !activeSessionId && !draftChatReady
    ? 'Trả giá / đề xuất giá'
    : listingInactiveForChat
      ? String(activeListingStatus || '').toUpperCase() === 'NOT_FOUND'
        ? 'Bài đăng không còn tồn tại trên chợ'
        : String(activeListingStatus || '').toUpperCase() === 'SOLD'
          ? 'Tin đăng đã được bán'
          : 'Bài đăng không còn hiển thị trên chợ'
      : isSellerInActiveChat
        ? 'Chỉ người mua mới có thể trả giá'
        : freeListingBuyerHint
          ? 'Hàng này free bạn nhé, không cần mặc cả đâu ^^'
          : buyerBlockedByDealSeal
            ? 'Đang chờ bạn Chấp nhận/Hủy thỏa thuận đã chốt, hoặc đã chấp nhận — không gửi trả giá mới'
            : hasOpenOfferAwaitingSeller
              ? 'Đang có lượt trả giá chờ người bán — chờ chấp nhận hoặc từ chối rồi mới gửi lượt mới'
              : 'Trả giá / đề xuất giá';

  const handleSelectChatSession = useCallback(
    (sessionId) => {
      setActiveSessionId(sessionId);
      setDraftListing(null);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('listingId');
          next.delete('messageId');
          next.set('sessionId', sessionId);
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [setSearchParams]
  );

  /** MUI v5 + native picker: `inputProps.min` chặn chọn quá khứ; cập nhật theo mỗi lần render khi dialog mở. */
  const minPickupDatetimeLocal = finalizeOpen ? toDatetimeLocal(new Date().toISOString()) : '';
  const finalizePickupMs = finalizePickupTimeLocal
    ? new Date(finalizePickupTimeLocal).getTime()
    : NaN;
  const finalizePickupIsFuture =
    Boolean(finalizePickupTimeLocal?.trim()) &&
    Number.isFinite(finalizePickupMs) &&
    finalizePickupMs > Date.now();

  // ── render ────────────────────────────────────────────────────────────────
  const showConversationMobile = Boolean(activeSessionId || draftChatReady);
  const listDisplay = { xs: showConversationMobile ? 'none' : 'flex', md: 'flex' };
  const panelDisplay = { xs: showConversationMobile ? 'flex' : 'none', md: 'flex' };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
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
          minHeight: 0,
          height: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
        }}
      >
        <ChatSidebar
          theme={theme}
          listDisplay={listDisplay}
          sessionsLoading={sessionsLoading}
          sessions={sessions}
          sessionsTotalElements={sessionsTotalElements}
          sidebarSearch={sidebarSearch}
          onSidebarSearchChange={setSidebarSearch}
          highlightSearchQuery={sidebarSearchForHighlight}
          activeSessionId={activeSessionId}
          setActiveSessionId={handleSelectChatSession}
          navigate={navigate}
          formatSessionTimeShort={formatSessionTimeShort}
          listingUnavailableByListingId={listingUnavailableByListingId}
        />

        {/* ── Chat panel ── */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            alignSelf: 'stretch',
            display: panelDisplay,
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            maxHeight: '100%',
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
          {!activeSessionId && listingIdFromUrl && draftListingLoading ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : !activeSessionId && listingIdFromUrl && draftListingError ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Typography color="error" align="center">
                Không tải được tin đăng. Thử lại từ trang chi tiết tin.
              </Typography>
            </Box>
          ) : !activeSessionId && !draftChatReady ? (
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
                currentUserId={currentUserId}
                isSellerInActiveChat={isSellerInActiveChat}
                wsConnected={wsConnected}
                showInChatSearch={Boolean(activeSessionId)}
                onOpenInChatSearch={() => setInChatSearchOpen(true)}
                listingUnavailable={Boolean(activeSession?.listingId && listingInactiveForChat)}
                showBlockUser={chatBlockTargetUserId != null}
                onOpenBlockUser={() => setChatBlockDialogOpen(true)}
              />

              {/* Tin đang trao đổi (giống banner chợ) */}
              <ListingContextBanner
                theme={theme}
                activeSession={activeSession}
                activeListingThumb={activeListingThumb}
                isSellerInActiveChat={isSellerInActiveChat}
                showPostSaleActions={showPostSaleActions}
                onPostSaleAction={handlePostSaleBannerAction}
                postSaleOutcome={resolvedPostSaleBannerOutcome}
                postSaleBusy={postSaleBannerBusy}
                finalizeDisabled={!latestPendingOfferIdForSeller}
                onFinalizeOrder={() => {
                  setFinalizeOpen(true);
                }}
                listingUnavailable={Boolean(activeSession?.listingId && listingInactiveForChat)}
              />

              <ChatMessagesPanel
                theme={theme}
                messagesScrollRef={messagesScrollRef}
                onScroll={handleMessagesScroll}
                updateJumpToLatestVisibility={updateJumpToLatestVisibility}
                historyLoading={historyLoading}
                loadingOlderHistory={loadingOlderHistory}
                historyHasMore={historyHasMore}
                displayMessages={displayMessages}
                currentUserId={currentUserId}
                highlightedMessageId={highlightedMessageId}
                bubbleSearchHighlight={bubbleSearchHighlight}
                handleAccept={handleAccept}
                handleReject={handleReject}
                handleDealConfirmDecision={handleDealConfirmDecision}
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
                activeSessionId={activeSessionId || (draftChatReady ? 'draft' : null)}
                setOfferOpen={setOfferOpen}
                priceOfferDisabled={priceOfferDisabled}
                priceOfferTooltip={priceOfferTooltip}
                freeListingBuyerHint={freeListingBuyerHint}
                onFreeListingOfferHint={() =>
                  showToast('Hàng này free bạn nhé, không cần mặc cả đâu ^^', 'info')
                }
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

      <ChatSearchInConversationDialog
        open={inChatSearchOpen}
        onClose={() => setInChatSearchOpen(false)}
        sessionId={activeSessionId}
        onPickMessage={handleInChatSearchPick}
      />

      <BlockUserConfirmDialog
        open={chatBlockDialogOpen}
        onClose={() => setChatBlockDialogOpen(false)}
        displayName={activeSession?.otherParticipantName || 'Người dùng'}
        onConfirm={() =>
          chatBlockTargetUserId
            ? blockUserById(chatBlockTargetUserId).then(() => {
              setActiveSessionId(null);
              fetchSessions();
            })
            : Promise.resolve()
        }
      />

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

      <Dialog
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: DEAL_UI.bg,
            border: `1px solid ${DEAL_UI.border}`,
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ color: DEAL_UI.text, fontWeight: 800, letterSpacing: 0.2, pb: 0.75 }}>
          Xác nhận thỏa thuận
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography fontSize="13px" sx={{ color: DEAL_UI.textMuted, mt: 0 }}>
            Vui lòng kiểm tra kỹ các thông tin dưới đây trước khi hoàn tất.
          </Typography>
          <Divider sx={{ borderColor: DEAL_UI.border, mt: 1.0, mb: 1.5 }} />

          {/* Section: Tin đăng */}
          <Typography fontWeight={700} fontSize="14px" sx={{ color: DEAL_UI.text, mb: 1.25 }}>
            Tin đăng
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: DEAL_UI.surface,
              cursor: 'default',
              transition: 'background 0.15s',
              border: `1px solid ${DEAL_UI.border}`,
            }}
          >
            {activeListingThumb ? (
              <Box
                component="img"
                src={activeListingThumb}
                alt={listingTitleForFinalize || 'Ảnh tin đăng'}
                sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }}
              />
            ) : (
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  border: `1px dashed ${alpha(DEAL_UI.accent, 0.35)}`,
                }}
              >
                <StoreOutlinedIcon sx={{ color: DEAL_UI.textMuted, fontSize: 28 }} />
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} fontSize="14px" sx={{ color: DEAL_UI.text }} noWrap>
                {listingTitleForFinalize}
              </Typography>
              <Typography fontSize="13px" sx={{ color: DEAL_UI.textMuted, mt: 0.35 }}>
                Giá niêm yết:{' '}
                <Box component="span" sx={{ color: alpha(DEAL_UI.accent, 0.95), fontWeight: 800 }}>
                  {fmtPrice(listingPriceForFinalize)}
                </Box>
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: DEAL_UI.border, mb: 1.75 }} />

          {/* Section: Thông tin thỏa thuận */}
          <Typography fontWeight={700} fontSize="14px" sx={{ color: DEAL_UI.text, mb: 1.25 }}>
            Thông tin thỏa thuận
          </Typography>
          <Stack spacing={2.5} mb={2}>
            <FormField
              label="Giá thỏa thuận"
              value={
                offerContentToPriceText(latestAcceptedOfferForFinalize?.content) ||
                fmtPrice(listingPriceForFinalize)
              }
              icon={<AttachMoneyIcon />}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <FormField
                label="Người mua"
                value={activeSession?.otherParticipantName || '—'}
                icon={<PersonOutlineIcon />}
              />
              <FormField
                label="Người bán"
                value={currentUser?.fullName || '—'}
                icon={<StoreOutlinedIcon />}
              />
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: DEAL_UI.border, mb: 1.75 }} />

          {/* Section: Thời gian & Địa điểm */}
          <Typography fontWeight={700} fontSize="14px" sx={{ color: DEAL_UI.text, mb: 1.25 }}>
            Thời gian &amp; Địa điểm
          </Typography>
          <Stack spacing={2.5} mb={0.5}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha(DEAL_UI.accent, 0.22),
                  border: `1px solid ${alpha(DEAL_UI.accent, 0.28)}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <AccessTimeIcon sx={{ color: DEAL_UI.text }} fontSize="small" />
              </Box>
              <TextField
                label="Thời gian nhận hàng"
                value={finalizePickupTimeLocal}
                onChange={(e) => setFinalizePickupTimeLocal(e.target.value)}
                size="small"
                fullWidth
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                inputProps={
                  minPickupDatetimeLocal
                    ? { min: minPickupDatetimeLocal, step: 60 }
                    : { step: 60 }
                }
                error={
                  Boolean(finalizePickupTimeLocal?.trim()) &&
                  (!Number.isFinite(finalizePickupMs) || finalizePickupMs <= Date.now())
                }
                helperText={
                  finalizePickupTimeLocal?.trim() &&
                    (!Number.isFinite(finalizePickupMs) || finalizePickupMs <= Date.now())
                    ? 'Chọn thời gian sau thời điểm hiện tại — không dùng thời gian quá khứ.'
                    : undefined
                }
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: DEAL_UI.surface,
                    color: DEAL_UI.text,
                    fontSize: DEAL_FONT.input,
                    borderRadius: '10px',
                  },
                  '& .MuiInputBase-input': {
                    color: DEAL_UI.text,
                    fontSize: DEAL_FONT.input,
                  },
                  '& .MuiInputLabel-root': {
                    color: DEAL_UI.textMuted,
                    fontSize: DEAL_FONT.label,
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: DEAL_UI.accent },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: DEAL_UI.accent,
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: DEAL_UI.accent,
                    borderWidth: 1,
                  },
                  // Make native calendar icon white + pointer cursor
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    opacity: 0.9,
                    cursor: 'pointer',
                  },
                  '& input::-webkit-calendar-picker-indicator:hover': {
                    opacity: 1,
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha(DEAL_UI.accent, 0.22),
                  border: `1px solid ${alpha(DEAL_UI.accent, 0.28)}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <LocationOnOutlinedIcon sx={{ color: DEAL_UI.text }} fontSize="small" />
              </Box>
              <TextField
                label="Địa điểm nhận hàng"
                value={finalizePickupLocationText}
                onChange={(e) => setFinalizePickupLocationText(e.target.value)}
                size="small"
                fullWidth
                multiline
                minRows={2}
                placeholder={finalizeListingLoading ? 'Đang tải…' : fmtAddress(pickupAddressForFinalize)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: DEAL_UI.surface,
                    color: DEAL_UI.text,
                    fontSize: DEAL_FONT.input,
                    borderRadius: '10px',
                  },
                  '& .MuiInputBase-input': {
                    color: DEAL_UI.text,
                    fontSize: DEAL_FONT.input,
                  },
                  '& .MuiInputLabel-root': {
                    color: DEAL_UI.textMuted,
                    fontSize: DEAL_FONT.label,
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: DEAL_UI.accent },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: DEAL_UI.accent,
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: DEAL_UI.accent,
                    borderWidth: 1,
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.25, pb: 2, pt: 1.25 }}>
          <Button
            variant="outlined"
            onClick={() => setFinalizeOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2.5,
              px: 2,
              py: 0.9,
              color: DEAL_UI.text,
              borderColor: alpha(DEAL_UI.text, 0.16),
              bgcolor: alpha(DEAL_UI.text, 0.04),
              '&:hover': {
                borderColor: alpha(DEAL_UI.text, 0.22),
                bgcolor: alpha(DEAL_UI.text, 0.07),
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!finalizePickupIsFuture || finalizeListingLoading}
            sx={{
              textTransform: 'none',
              borderRadius: 2.5,
              px: 2.5,
              py: 0.9,
              fontWeight: 900,
              bgcolor: DEAL_UI.accent,
              color: '#fff',
              boxShadow: `0 10px 22px ${alpha(DEAL_UI.accent, 0.18)}`,
              '&:hover': {
                bgcolor: alpha(DEAL_UI.accent, 0.9),
                color: '#fff',
                boxShadow: `0 12px 26px ${alpha(DEAL_UI.accent, 0.24)}`,
              },
              '&:active': {
                transform: 'translateY(1px)',
              },
            }}
            onClick={async () => {
              const ok = await sendDealConfirmation();
              if (ok) setFinalizeOpen(false);
            }}
          >
            Chốt đơn
          </Button>
        </DialogActions>
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
