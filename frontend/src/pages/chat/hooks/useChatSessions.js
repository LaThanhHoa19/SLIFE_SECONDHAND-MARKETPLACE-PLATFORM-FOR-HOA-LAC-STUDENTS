import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as chatApi from '../../../api/chatApi';
import { getListing } from '../../../api/listingApi';
import { fullImageUrl } from '../../../utils/constants';
import { LOCAL_BUYER_CHIPS, LOCAL_SELLER_CHIPS } from '../chatMessageUtils';

export function useChatSessions({ activeSessionId, currentUserId, sessionsVersion }) {
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sessionsTotalElements, setSessionsTotalElements] = useState(0);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [quickRepliesFromApi, setQuickRepliesFromApi] = useState([]);
    const [listingMetaById, setListingMetaById] = useState({});
    const fetchSessionsDebounceRef = useRef(null);

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedSearch(sidebarSearch.trim()), 320);
        return () => window.clearTimeout(t);
    }, [sidebarSearch]);

    const buildListParams = useCallback(() => {
        const params = { filter: 'ALL' };
        if (debouncedSearch) {
            params.q = debouncedSearch;
        }
        return params;
    }, [debouncedSearch]);

    const fetchSessions = useCallback(() => {
        return chatApi
            .getChats(buildListParams())
            .then((res) => {
                const body = res?.data;
                const raw = body?.data;
                const list = Array.isArray(raw?.content)
                    ? raw.content
                    : Array.isArray(raw)
                        ? raw
                        : Array.isArray(body?.content)
                            ? body.content
                            : Array.isArray(body)
                                ? body
                                : [];
                const total =
                    typeof raw?.totalElements === 'number'
                        ? raw.totalElements
                        : Array.isArray(list)
                            ? list.length
                            : 0;
                setSessionsTotalElements(total);
                setSessions(list);
                return list;
            })
            .catch((err) => {
                if (import.meta.env.DEV) console.warn('[Chat] getChats failed:', err?.message ?? err);
                setSessionsTotalElements(0);
                return [];
            });
    }, [buildListParams]);

    const scheduleFetchSessions = useCallback(() => {
        if (fetchSessionsDebounceRef.current != null) {
            window.clearTimeout(fetchSessionsDebounceRef.current);
        }
        fetchSessionsDebounceRef.current = window.setTimeout(() => {
            fetchSessionsDebounceRef.current = null;
            fetchSessions();
        }, 350);
    }, [fetchSessions]);

    const markSessionReadOptimistic = useCallback((sessionId) => {
        if (!sessionId) return;
        setSessions((prev) =>
            (Array.isArray(prev) ? prev : []).map((s) => {
                if (!s || s.sessionId !== sessionId) return s;
                return {
                    ...s,
                    unreadCount: 0,
                    unread_count: 0,
                    unreadMessages: 0,
                    unread_messages: 0,
                };
            }),
        );
    }, []);

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
        // Chỉ bật spinner full-size khi chưa có dữ liệu lần đầu.
        if (sessions.length === 0) setSessionsLoading(true);
        fetchSessions().finally(() => {
            if (alive) setSessionsLoading(false);
        });
        return () => {
            alive = false;
        };
    }, [sessionsVersion, debouncedSearch, fetchSessions, sessions.length]);

    useEffect(() => {
        chatApi
            .getQuickReplies()
            .then((res) => {
                const raw = res?.data?.data ?? res?.data;
                setQuickRepliesFromApi(Array.isArray(raw) ? raw : []);
            })
            .catch(() => setQuickRepliesFromApi([]));
    }, []);

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
                    const isGiveaway = Boolean(data?.isGiveaway);
                    const st = String(data?.status ?? data?.itemStatus ?? '').toUpperCase();
                    const listingUnavailable = st !== '' && st !== 'ACTIVE';
                    return [id, { thumb: thumb || null, price, isGiveaway, status: st, listingUnavailable }];
                } catch {
                    return [
                        id,
                        {
                            thumb: null,
                            price: null,
                            isGiveaway: false,
                            status: 'NOT_FOUND',
                            listingUnavailable: true,
                        },
                    ];
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

    const activeSession = useMemo(
        () => sessions.find((s) => s.sessionId === activeSessionId),
        [sessions, activeSessionId],
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

    const activeListingIsGiveaway = useMemo(() => {
        if (activeSession?.listingId == null) return false;
        return Boolean(listingMetaById[activeSession.listingId]?.isGiveaway);
    }, [activeSession, listingMetaById]);

    const isSellerInActiveChat = useMemo(() => {
        if (!activeSession || currentUserId == null) return false;
        return Number(activeSession.sellerId) === Number(currentUserId);
    }, [activeSession, currentUserId]);

    const listingUnavailableByListingId = useMemo(() => {
        const out = {};
        Object.entries(listingMetaById).forEach(([key, meta]) => {
            if (meta?.listingUnavailable) {
                out[Number(key)] = true;
            }
        });
        return out;
    }, [listingMetaById]);

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

    return {
        sessions,
        sessionsLoading,
        sessionsTotalElements,
        sidebarSearch,
        setSidebarSearch,
        /** Cùng chuỗi gửi lên API `q` — dùng tô vàng khớp trong sidebar */
        sidebarSearchForHighlight: debouncedSearch,
        activeSession,
        activeListingThumb,
        activeListingPrice,
        activeListingIsGiveaway,
        isSellerInActiveChat,
        suggestedChatPhrases,
        fetchSessions,
        scheduleFetchSessions,
        markSessionReadOptimistic,
        setSessions,
        listingUnavailableByListingId,
    };
}
