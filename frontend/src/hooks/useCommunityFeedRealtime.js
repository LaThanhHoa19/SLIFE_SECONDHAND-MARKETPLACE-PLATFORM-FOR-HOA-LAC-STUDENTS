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
        (typeof window !== 'undefined' ? `${window.location.origin}/ws` : 'http://localhost:8080/ws');
    if (!token) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}token=${encodeURIComponent(token)}`;
}

/**
 * @param {boolean} enabled
 * @param {(payload: { postId: number, likeCount: number, commentCount: number }) => void} onStats
 * @param {(event: { type: string, postId?: number, userId?: number, saved?: boolean, likeCount?: number, commentCount?: number }) => void} [onEvent]
 */
export default function useCommunityFeedRealtime(enabled, onStats, onEvent) {
    const { token } = useAuth();
    const onStatsRef = useRef(onStats);
    const onEventRef = useRef(onEvent);
    onStatsRef.current = onStats;
    onEventRef.current = onEvent;

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
                        const type = String(data?.type || 'STATS');
                        const postId = Number(data?.postId);
                        if (!Number.isFinite(postId)) return;

                        if (type === 'STATS') {
                            const likeCount = Number(data?.likeCount);
                            const commentCount = Number(data?.commentCount);
                            onStatsRef.current?.({
                                postId,
                                likeCount: Number.isFinite(likeCount) ? likeCount : 0,
                                commentCount: Number.isFinite(commentCount) ? commentCount : 0,
                            });
                        }

                        onEventRef.current?.({
                            type,
                            postId,
                            userId: Number(data?.userId),
                            saved: typeof data?.saved === 'boolean' ? data.saved : undefined,
                            likeCount: Number(data?.likeCount),
                            commentCount: Number(data?.commentCount),
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
