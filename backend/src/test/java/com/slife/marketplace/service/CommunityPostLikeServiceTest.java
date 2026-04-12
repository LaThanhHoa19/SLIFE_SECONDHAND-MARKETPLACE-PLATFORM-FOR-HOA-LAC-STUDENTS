package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.CommunityPostCardResponse;
import com.slife.marketplace.dto.response.PagedResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
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
    @Mock private CommunityPostService communityPostService;

    private CommunityPostLikeService service;

    @BeforeEach
    void setUp() {
        service = new CommunityPostLikeService(
                likeRepository, postRepository, notificationService, statsBroadcastService, communityPostService);
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
    @DisplayName("Nhóm: Bật/tắt (toggle)")
    class Toggle {

        @Test
        @DisplayName("[Lỗi] user null → UNAUTHORIZED")
        void userNull_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(null, 1L));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] user BANNED/RESTRICTED → USER_BANNED_OR_RESTRICTED")
        void bannedRestricted_shouldThrow() {
            SlifeException ex1 = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "BANNED"), 1L));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex1.getErrorCode());
            SlifeException ex2 = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "RESTRICTED"), 1L));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex2.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] post không tồn tại → COMMUNITY_POST_NOT_FOUND")
        void postMissing_shouldThrow() {
            when(postRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "ACTIVE"), 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] post hidden/deleted hoặc status != ACTIVE → COMMUNITY_POST_NOT_FOUND")
        void postNotActive_shouldThrow() {
            User me = user(1L, "ACTIVE");
            when(postRepository.findById(1L)).thenReturn(Optional.of(
                    post(1L, user(2L, "ACTIVE"), "HIDDEN", null, null)));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(me, 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] post đã soft-delete (deletedAt) → COMMUNITY_POST_NOT_FOUND")
        void postDeletedAt_shouldThrow() {
            User me = user(1L, "ACTIVE");
            when(postRepository.findById(1L)).thenReturn(Optional.of(
                    post(1L, user(2L, "ACTIVE"), CommunityPost.STATUS_ACTIVE, Instant.now(), null)));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(me, 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] post bị ẩn mod (hiddenAt) → COMMUNITY_POST_NOT_FOUND")
        void postHiddenAt_shouldThrow() {
            User me = user(1L, "ACTIVE");
            when(postRepository.findById(1L)).thenReturn(Optional.of(
                    post(1L, user(2L, "ACTIVE"), CommunityPost.STATUS_ACTIVE, null, Instant.now())));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(me, 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Đã like → unlike: delete + count + broadcast; không notify")
        void alreadyLiked_shouldUnlike() {
            User me = user(1L, "ACTIVE");
            CommunityPost p = post(1L, user(2L, "ACTIVE"), CommunityPost.STATUS_ACTIVE, null, null);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(true);
            when(likeRepository.countByPost_Id(1L)).thenReturn(7L);

            ToggleLikeResponse out = service.toggle(me, 1L);

            assertFalse(out.liked());
            assertEquals(7L, out.likeCount());
            verify(likeRepository).deleteByUser_IdAndPost_Id(1L, 1L);
            verify(statsBroadcastService).broadcastStats(1L);
            verify(statsBroadcastService).broadcastLikedToggled(1L, 1L, false);
            verify(notificationService, never()).notifyCommunityPostLiked(any(), any(), anyLong());
        }

        @Test
        @DisplayName("Chưa like → like: save + (notify nếu khác author) + count + broadcast")
        void notLiked_shouldLikeAndNotify() {
            User me = user(1L, "ACTIVE");
            User author = user(2L, "ACTIVE");
            CommunityPost p = post(1L, author, CommunityPost.STATUS_ACTIVE, null, null);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(false);
            when(likeRepository.countByPost_Id(1L)).thenReturn(8L);

            ToggleLikeResponse out = service.toggle(me, 1L);

            assertTrue(out.liked());
            assertEquals(8L, out.likeCount());
            verify(likeRepository).save(any());
            verify(notificationService).notifyCommunityPostLiked(author, me, 1L);
            verify(statsBroadcastService).broadcastStats(1L);
            verify(statsBroadcastService).broadcastLikedToggled(1L, 1L, true);
        }

        @Test
        @DisplayName("Like post của chính mình → không notify")
        void likeOwnPost_shouldNotNotify() {
            User me = user(1L, "ACTIVE");
            CommunityPost p = post(1L, me, CommunityPost.STATUS_ACTIVE, null, null);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(false);
            when(likeRepository.countByPost_Id(1L)).thenReturn(1L);

            service.toggle(me, 1L);

            verify(notificationService, never()).notifyCommunityPostLiked(any(), any(), anyLong());
            verify(statsBroadcastService).broadcastLikedToggled(1L, 1L, true);
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Bài cộng đồng đã thích (feed)")
    class LikedFeed {

        @Test
        @DisplayName("[Lỗi] user null → UNAUTHORIZED")
        void userNull_shouldThrow() {
            assertEquals(ErrorCode.UNAUTHORIZED,
                    assertThrows(SlifeException.class, () -> service.getLikedFeed(null, 0, 20)).getErrorCode());
        }

        @Test
        @DisplayName("page âm → clamp 0; size 0 → mặc định 20")
        void pageNegative_sizeZero_usesDefaults() {
            User me = user(1L, "ACTIVE");
            Page<CommunityPost> empty = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
            when(likeRepository.findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE), any()))
                    .thenReturn(empty);
            PagedResponse<CommunityPostCardResponse> out = mock(PagedResponse.class);
            when(communityPostService.toCardPage(any(Page.class), eq(1L), eq(false))).thenReturn(out);

            assertSame(out, service.getLikedFeed(me, -3, 0));

            verify(likeRepository).findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE),
                    argThat((Pageable p) -> p.getPageNumber() == 0 && p.getPageSize() == 20));
        }

        @Test
        @DisplayName("size > 50 → clamp 50")
        void sizeOverCap_clampsTo50() {
            User me = user(1L, "ACTIVE");
            Page<CommunityPost> empty = new PageImpl<>(List.of(), PageRequest.of(0, 50), 0);
            when(likeRepository.findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE), any()))
                    .thenReturn(empty);
            PagedResponse<CommunityPostCardResponse> out = mock(PagedResponse.class);
            when(communityPostService.toCardPage(any(Page.class), eq(1L), eq(false))).thenReturn(out);

            service.getLikedFeed(me, 0, 999);

            verify(likeRepository).findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE),
                    argThat((Pageable p) -> p.getPageSize() == 50));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Truy vấn đơn giản")
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

