import { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import { upsertMessages } from '../chatMessageUtils';

const WS_URL =
    import.meta.env.VITE_WS_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/ws` : 'http://localhost:8080/ws');

export function useChatRealtime({
                                    activeSessionId,
                                    currentUser,
                                    authToken,
                                    fetchHistory,
                                    scheduleFetchSessions,
                                    setMessages,
                                    setInputText,
                                }) {
    const [wsConnected, setWsConnected] = useState(false);
    const [typingLabel, setTypingLabel] = useState('');
    const stompRef = useRef(null);
    const typingTimerRef = useRef(null);
    const typingSentRef = useRef(false);

    useEffect(() => {
        if (!activeSessionId || !currentUser) return;
        const token = authToken || null;

        const client = new StompClient({
            webSocketFactory: () => {
                const url = token ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : WS_URL;
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
                        if (msg?.event === 'OFFER_STATUS' || msg?.type === 'OFFER_STATUS') {
                            const oid = msg.offerId;
                            const st = msg.status;
                            if (oid != null && st) {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.messageType === 'OFFER_PROPOSAL' &&
                                        Number(m.offerId) === Number(oid)
                                            ? { ...m, offerStatus: st }
                                            : m,
                                    ),
                                );
                            }
                            scheduleFetchSessions();
                            return;
                        }
                        setMessages((prev) => upsertMessages(prev, msg, { dropPending: true }));
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
    }, [activeSessionId, currentUser, fetchHistory, authToken, scheduleFetchSessions, setMessages]);

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

    const handleInputChange = useCallback(
        (e) => {
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
        },
        [activeSessionId, setInputText, stopTyping, wsConnected],
    );

    useEffect(() => {
        return () => {
            clearTimeout(typingTimerRef.current);
            typingSentRef.current = false;
        };
    }, []);

    return {
        wsConnected,
        typingLabel,
        stopTyping,
        handleInputChange,
    };
}
