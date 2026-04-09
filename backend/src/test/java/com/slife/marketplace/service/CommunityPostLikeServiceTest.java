package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ToggleLikeResponse;
import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostLikeRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityPostLikeServiceTest {

    @Mock private CommunityPostLikeRepository likeRepository;
    @Mock private CommunityPostRepository postRepository;
    @Mock private NotificationService notificationService;
    @Mock private CommunityPostStatsBroadcastService statsBroadcastService;

    private CommunityPostLikeService service;

    @BeforeEach
    void setUp() {
        service = new CommunityPostLikeService(likeRepository, postRepository, notificationService, statsBroadcastService);
    }

    private static User user(long id, String status) {
        User u = new User();
        u.setId(id);
        u.setStatus(status);
        u.setRole("USER");
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    private static CommunityPost post(long id, User author, String status, Instant deletedAt, Instant hiddenAt) {
        CommunityPost p = new CommunityPost();
        p.setId(id);
        p.setAuthor(author);
        p.setStatus(status);
        p.setDeletedAt(deletedAt);
        p.setHiddenAt(hiddenAt);
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        return p;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("toggle")
    class Toggle {

        @Test
        @DisplayName("user null -> UNAUTHORIZED")
        void userNull_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(null, 1L));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("user BANNED/RESTRICTED -> USER_BANNED_OR_RESTRICTED")
        void bannedRestricted_shouldThrow() {
            SlifeException ex1 = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "BANNED"), 1L));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex1.getErrorCode());
            SlifeException ex2 = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "RESTRICTED"), 1L));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex2.getErrorCode());
        }

        @Test
        @DisplayName("post không tồn tại -> COMMUNITY_POST_NOT_FOUND")
        void postMissing_shouldThrow() {
            when(postRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "ACTIVE"), 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("post hidden/deleted hoặc status != ACTIVE -> COMMUNITY_POST_NOT_FOUND")
        void postNotActive_shouldThrow() {
            User me = user(1L, "ACTIVE");
            when(postRepository.findById(1L)).thenReturn(Optional.of(
                    post(1L, user(2L, "ACTIVE"), "HIDDEN", null, null)));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(me, 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Đã like -> unlike: delete + count + broadcast; không notify")
        void alreadyLiked_shouldUnlike() {
            User me = user(1L, "ACTIVE");
            CommunityPost p = post(1L, user(2L, "ACTIVE"), CommunityPost.STATUS_ACTIVE, null, null);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(true);
            when(likeRepository.countByPost_Id(1L)).thenReturn(7L);

            ToggleLikeResponse out = service.toggle(me, 1L);

            assertFalse(out.isLiked());
            assertEquals(7L, out.getLikeCount());
            verify(likeRepository).deleteByUser_IdAndPost_Id(1L, 1L);
            verify(statsBroadcastService).broadcastStats(1L);
            verify(notificationService, never()).notifyCommunityPostLiked(any(), any(), anyLong());
        }

        @Test
        @DisplayName("Chưa like -> like: save + (notify nếu khác author) + count + broadcast")
        void notLiked_shouldLikeAndNotify() {
            User me = user(1L, "ACTIVE");
            User author = user(2L, "ACTIVE");
            CommunityPost p = post(1L, author, CommunityPost.STATUS_ACTIVE, null, null);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(false);
            when(likeRepository.countByPost_Id(1L)).thenReturn(8L);

            ToggleLikeResponse out = service.toggle(me, 1L);

            assertTrue(out.isLiked());
            assertEquals(8L, out.getLikeCount());
            verify(likeRepository).save(any());
            verify(notificationService).notifyCommunityPostLiked(author, me, 1L);
            verify(statsBroadcastService).broadcastStats(1L);
        }

        @Test
        @DisplayName("Like post của chính mình -> không notify")
        void likeOwnPost_shouldNotNotify() {
            User me = user(1L, "ACTIVE");
            CommunityPost p = post(1L, me, CommunityPost.STATUS_ACTIVE, null, null);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(false);
            when(likeRepository.countByPost_Id(1L)).thenReturn(1L);

            service.toggle(me, 1L);

            verify(notificationService, never()).notifyCommunityPostLiked(any(), any(), anyLong());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("simple queries")
    class Queries {

        @Test
        @DisplayName("countByPostId: trả repository count")
        void countByPostId_shouldReturnCount() {
            when(likeRepository.countByPost_Id(10L)).thenReturn(5L);
            assertEquals(5L, service.countByPostId(10L));
        }

        @Test
        @DisplayName("isLikedBy: trả repository exists")
        void isLikedBy_shouldReturnExists() {
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 10L)).thenReturn(true);
            assertTrue(service.isLikedBy(1L, 10L));
        }
    }
}

