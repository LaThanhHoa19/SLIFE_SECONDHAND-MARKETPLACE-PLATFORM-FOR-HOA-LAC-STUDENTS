import { useCallback, useState } from 'react';
import * as followApi from '../api/followApi';

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
                    updateFollowingCount(user, updateAuthUser, false);
                    onSuccess?.(false);
                } else {
                    await followApi.followUser(targetUserId);
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
