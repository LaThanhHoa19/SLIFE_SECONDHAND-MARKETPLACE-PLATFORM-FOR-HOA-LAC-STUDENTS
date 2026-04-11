import { useCallback, useState } from 'react';
import * as followApi from '../api/followApi';

const FOLLOW_CACHE_KEY = 'slife.follow.cache.v1';

function readFollowCache() {
    try {
        const raw = localStorage.getItem(FOLLOW_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

export function getCachedFollowState(targetUserId) {
    if (!targetUserId) return null;
    const cache = readFollowCache();
    const v = cache[String(targetUserId)];
    return typeof v === 'boolean' ? v : null;
}

export function setCachedFollowState(targetUserId, nextIsFollowing) {
    if (!targetUserId || typeof nextIsFollowing !== 'boolean') return;
    const cache = readFollowCache();
    cache[String(targetUserId)] = nextIsFollowing;
    try {
        localStorage.setItem(FOLLOW_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // ignore
    }
}

function updateFollowingCount(user, updateAuthUser, nextIsFollowing) {
    if (!user?.id || typeof updateAuthUser !== 'function') return;
    const base = user.followingCount ?? 0;
    const nextCount = nextIsFollowing ? base + 1 : Math.max(0, base - 1);
    updateAuthUser({ followingCount: nextCount });
}

/**
 * Shared follow/unfollow handler across profile/listing UIs.
 */
export function useFollowActions({ user, updateAuthUser }) {
    const [followLoading, setFollowLoading] = useState(false);

    const toggleFollow = useCallback(
        async ({
                   targetUserId,
                   isFollowing,
                   onSuccess,
                   onError,
                   onUnauthenticated,
                   isAuthenticated = true,
               }) => {
            if (!targetUserId) return;
            if (!isAuthenticated) {
                onUnauthenticated?.();
                return;
            }

            setFollowLoading(true);
            try {
                if (isFollowing) {
                    await followApi.unfollowUser(targetUserId);
                    setCachedFollowState(targetUserId, false);
                    updateFollowingCount(user, updateAuthUser, false);
                    onSuccess?.(false);
                } else {
                    await followApi.followUser(targetUserId);
                    setCachedFollowState(targetUserId, true);
                    updateFollowingCount(user, updateAuthUser, true);
                    onSuccess?.(true);
                }
            } catch (err) {
                onError?.(err);
            } finally {
                setFollowLoading(false);
            }
        },
        [user, updateAuthUser],
    );

    return { followLoading, toggleFollow };
}
