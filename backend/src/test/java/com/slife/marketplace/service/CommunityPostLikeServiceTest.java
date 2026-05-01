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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    @SuppressWarnings("unchecked")
    private PagedResponse<CommunityPostCardResponse> mockCardPageResponse() {
        return (PagedResponse<CommunityPostCardResponse>) mock(PagedResponse.class);
    }

    @Nested
    @DisplayName("Function: toggle")
    class ToggleGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - user not authenticated")
        void utcId01_shouldThrowUnauthorized_whenUserNull() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(null, 1L));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - user is BANNED or RESTRICTED")
        void utcId02_shouldThrowRestricted_whenUserBannedOrRestricted() {
            SlifeException ex1 = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "BANNED"), 1L));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex1.getErrorCode());

            SlifeException ex2 = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "RESTRICTED"), 1L));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex2.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - post does not exist")
        void utcId03_shouldThrowNotFound_whenPostMissing() {
            when(postRepository.findById(1L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "ACTIVE"), 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - post is not active")
        void utcId04_shouldThrowNotFound_whenPostNotActive() {
            User me = user(1L, "ACTIVE");
            when(postRepository.findById(1L)).thenReturn(Optional.of(
                    post(1L, user(2L, "ACTIVE"), "HIDDEN", null, null)));

            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(me, 1L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID05 [Positive] - unlike when already liked")
        void utcId05_shouldUnlike_whenAlreadyLiked() {
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
        @DisplayName("UTCID06 [Positive] - like and notify author")
        void utcId06_shouldLikeAndNotify_whenNotLikedAndOtherAuthor() {
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
        @DisplayName("UTCID07 [Positive] - like own post without notify")
        void utcId07_shouldLikeWithoutNotify_whenAuthorIsSelf() {
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

    @Nested
    @DisplayName("Function: getLikedFeed")
    class GetLikedFeedGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - user null")
        void utcId01_shouldThrowUnauthorized_whenUserNull() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getLikedFeed(null, 0, 20));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - negative page and non-positive size")
        void utcId02_shouldClampPageAndUseDefaultSize() {
            User me = user(1L, "ACTIVE");
            Page<CommunityPost> empty = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
            when(likeRepository.findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE), any()))
                    .thenReturn(empty);
            PagedResponse<CommunityPostCardResponse> out = mockCardPageResponse();
            when(communityPostService.toCardPage(org.mockito.ArgumentMatchers.<Page<CommunityPost>>any(), eq(1L), eq(false)))
                    .thenReturn(out);

            assertSame(out, service.getLikedFeed(me, -3, 0));

            verify(likeRepository).findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE),
                    argThat((Pageable p) -> p.getPageNumber() == 0 && p.getPageSize() == 20));
        }

        @Test
        @DisplayName("UTCID03 [Positive] - size over max is clamped to 50")
        void utcId03_shouldClampSizeTo50_whenOverLimit() {
            User me = user(1L, "ACTIVE");
            Page<CommunityPost> empty = new PageImpl<>(List.of(), PageRequest.of(0, 50), 0);
            when(likeRepository.findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE), any()))
                    .thenReturn(empty);
            when(communityPostService.toCardPage(org.mockito.ArgumentMatchers.<Page<CommunityPost>>any(), eq(1L), eq(false)))
                    .thenReturn(mockCardPageResponse());

            service.getLikedFeed(me, 0, 999);

            verify(likeRepository).findLikedPostsVisibleByUserId(eq(1L), eq(CommunityPost.STATUS_ACTIVE),
                    argThat((Pageable p) -> p.getPageNumber() == 0 && p.getPageSize() == 50));
        }
    }
}