/**
 * STOMP topic /topic/community/posts — cập nhật likeCount / commentCount khi có tương tác (backend broadcast).
 * SockJS giống chat/notifications; có JWT thì gửi ?token= (handshake).
 */
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from './useAuth';

function sockJsChatUrl(token) {
    const base =
        import.meta.env.VITE_WS_URL ||
        (typeof window !== 'undefined' ? `${window.location.origin}/chat` : 'http://localhost:8080/chat');
    if (!token) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}token=${encodeURIComponent(token)}`;
}

/**
 * @param {boolean} enabled
 * @param {(payload: { postId: number, likeCount: number, commentCount: number }) => void} onStats
 */
export default function useCommunityFeedRealtime(enabled, onStats) {
    const { token } = useAuth();
    const onStatsRef = useRef(onStats);
    onStatsRef.current = onStats;

    useEffect(() => {
        if (!enabled) return undefined;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(sockJsChatUrl(token || null)),
            reconnectDelay: 5000,
            debug: () => {},
            onConnect: () => {
                stompClient.subscribe('/topic/community/posts', (message) => {
                    try {
                        const raw = message?.body;
                        if (raw == null || raw === '') return;
                        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        const postId = Number(data?.postId);
                        if (!Number.isFinite(postId)) return;
                        const likeCount = Number(data?.likeCount);
                        const commentCount = Number(data?.commentCount);
                        onStatsRef.current?.({
                            postId,
                            likeCount: Number.isFinite(likeCount) ? likeCount : 0,
                            commentCount: Number.isFinite(commentCount) ? commentCount : 0,
                        });
                    } catch {
                        /* ignore malformed */
                    }
                });
            },
            onStompError: () => {},
        });

        stompClient.activate();
        return () => {
            if (stompClient.active) {
                stompClient.deactivate();
            }
        };
    }, [enabled, token]);
}
