package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import com.slife.marketplace.dto.response.UserProfileResponse;
import com.slife.marketplace.entity.Follow;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.BlockRepository;
import com.slife.marketplace.repository.FollowRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.ReviewRepository;
import com.slife.marketplace.repository.UserRepository;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowServiceTest {

    @Mock private FollowRepository followRepository;
    @Mock private UserRepository userRepository;
    @Mock private BlockRepository blockRepository;
    @Mock private BlockService blockService;
    @Mock private NotificationService notificationService;
    @Mock private ListingRepository listingRepository;
    @Mock private ReviewRepository reviewRepository;

    private FollowService service;

    @BeforeEach
    void setUp() {
        service = new FollowService(
                followRepository,
                userRepository,
                blockRepository,
                blockService,
                notificationService,
                listingRepository,
                reviewRepository
        );
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("getFollowers/getFollowing")
    class Lists {

        @Test
        @DisplayName("profileUserId null -> INVALID_INPUT")
        void nullProfile_shouldThrow() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.getFollowers(null, 0, 10)).getErrorCode());
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.getFollowing(null, 0, 10)).getErrorCode());
        }

        @Test
        @DisplayName("user not found -> USER_NOT_FOUND")
        void userNotFound_shouldThrow() {
            when(userRepository.existsById(10L)).thenReturn(false);
            assertEquals(ErrorCode.USER_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.getFollowers(10L, 0, 10)).getErrorCode());
            assertEquals(ErrorCode.USER_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.getFollowing(10L, 0, 10)).getErrorCode());
        }

        @Test
        @DisplayName("clamp page/size và call repo đúng")
        void clamp_shouldCallRepo() {
            when(userRepository.existsById(10L)).thenReturn(true);
            Page<FollowUserSummaryResponse> p = new PageImpl<>(List.of(), PageRequest.of(0, 1), 0);
            when(followRepository.findFollowerSummariesByFollowedId(eq(10L), any())).thenReturn(p);

            service.getFollowers(10L, -1, 0);

            verify(followRepository).findFollowerSummariesByFollowedId(eq(10L), argThat(pr ->
                    pr.getPageNumber() == 0 && pr.getPageSize() == 1));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("simple counts/queries")
    class Simple {

        @Test
        void isFollowing_nullInputs_false() {
            assertFalse(service.isFollowing(null, 1L));
            assertFalse(service.isFollowing(1L, null));
            verifyNoInteractions(followRepository);
        }

        @Test
        void findFollowedIdsAmong_nullOrEmpty_returnsEmpty() {
            assertTrue(service.findFollowedIdsAmong(null, List.of(1L)).isEmpty());
            assertTrue(service.findFollowedIdsAmong(1L, null).isEmpty());
            assertTrue(service.findFollowedIdsAmong(1L, List.of()).isEmpty());
        }

        @Test
        void findAllFollowedIds_null_returnsEmpty() {
            assertTrue(service.findAllFollowedIds(null).isEmpty());
        }

        @Test
        void findFollowerIdsOfUser_null_returnsEmpty() {
            assertTrue(service.findFollowerIdsOfUser(null).isEmpty());
        }

        @Test
        void findAllFollowedIds_repoNullOrEmpty_returnsEmpty() {
            when(followRepository.findFollowedIdsByFollowerId(1L)).thenReturn(null);
            assertTrue(service.findAllFollowedIds(1L).isEmpty());
            when(followRepository.findFollowedIdsByFollowerId(1L)).thenReturn(List.of());
            assertTrue(service.findAllFollowedIds(1L).isEmpty());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("follow/unfollow")
    class Mutations {

        @Test
        @DisplayName("follow: followedUserId null -> INVALID_INPUT")
        void follow_nullFollowed_shouldThrow() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.follow(user(1L), null)).getErrorCode());
        }

        @Test
        @DisplayName("follow: self -> FOLLOW_SELF")
        void follow_self_shouldThrow() {
            assertEquals(ErrorCode.FOLLOW_SELF,
                    assertThrows(SlifeException.class, () -> service.follow(user(1L), 1L)).getErrorCode());
        }

        @Test
        @DisplayName("follow: blocked either direction -> FOLLOW_BLOCKED")
        void follow_blocked_shouldThrow() {
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(1L, 2L)).thenReturn(true);
            assertEquals(ErrorCode.FOLLOW_BLOCKED,
                    assertThrows(SlifeException.class, () -> service.follow(user(1L), 2L)).getErrorCode());
        }

        @Test
        @DisplayName("follow: followed user missing -> USER_NOT_FOUND")
        void follow_missingUser_shouldThrow() {
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(anyLong(), anyLong())).thenReturn(false);
            when(userRepository.findById(2L)).thenReturn(Optional.empty());
            assertEquals(ErrorCode.USER_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.follow(user(1L), 2L)).getErrorCode());
        }

        @Test
        @DisplayName("follow: already exists -> FOLLOW_ALREADY")
        void follow_already_shouldThrow() {
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(anyLong(), anyLong())).thenReturn(false);
            when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L)));
            when(followRepository.existsByFollower_IdAndFollowed_Id(1L, 2L)).thenReturn(true);
            assertEquals(ErrorCode.FOLLOW_ALREADY,
                    assertThrows(SlifeException.class, () -> service.follow(user(1L), 2L)).getErrorCode());
        }

        @Test
        @DisplayName("follow: happy path -> save + notify")
        void follow_happyPath() {
            User follower = user(1L);
            User followed = user(2L);
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(anyLong(), anyLong())).thenReturn(false);
            when(userRepository.findById(2L)).thenReturn(Optional.of(followed));
            when(followRepository.existsByFollower_IdAndFollowed_Id(1L, 2L)).thenReturn(false);
            when(followRepository.save(any(Follow.class))).thenAnswer(inv -> inv.getArgument(0));

            service.follow(follower, 2L);

            verify(followRepository).save(any(Follow.class));
            verify(notificationService).notifyNewFollower(followed, follower);
        }

        @Test
        @DisplayName("unfollow: not following -> FOLLOW_NOT_FOLLOWING")
        void unfollow_notFollowing_shouldThrow() {
            when(followRepository.existsByFollower_IdAndFollowed_Id(1L, 2L)).thenReturn(false);
            assertEquals(ErrorCode.FOLLOW_NOT_FOLLOWING,
                    assertThrows(SlifeException.class, () -> service.unfollow(user(1L), 2L)).getErrorCode());
        }

        @Test
        @DisplayName("unfollow: happy path -> deleteByFollowerAndFollowed")
        void unfollow_happyPath() {
            when(followRepository.existsByFollower_IdAndFollowed_Id(1L, 2L)).thenReturn(true);
            service.unfollow(user(1L), 2L);
            verify(followRepository).deleteByFollower_IdAndFollowed_Id(1L, 2L);
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("buildProfileForViewer")
    class Profile {

        @Test
        @DisplayName("viewer null hoặc viewer=profile -> isFollowed/isBlocked/hasBlocked = null")
        void viewerNullOrSelf_shouldSetNullFlags() {
            User profile = user(5L);
            when(followRepository.countByFollowed_Id(5L)).thenReturn(1L);
            when(followRepository.countByFollower_Id(5L)).thenReturn(2L);
            when(listingRepository.countBySeller_IdAndStatus(5L, "ACTIVE")).thenReturn(3L);
            when(reviewRepository.countByReviewee_Id(5L)).thenReturn(0L);

            UserProfileResponse out1 = service.buildProfileForViewer(profile, null);
            assertNull(out1.getIsFollowedByViewer());
            assertNull(out1.getIsBlockedByViewer());
            assertNull(out1.getHasBlockedViewer());

            UserProfileResponse out2 = service.buildProfileForViewer(profile, 5L);
            assertNull(out2.getIsFollowedByViewer());
            assertNull(out2.getIsBlockedByViewer());
            assertNull(out2.getHasBlockedViewer());
        }

        @Test
        @DisplayName("ratingCount>0 + avg!=null -> set reputationScore scale(2)")
        void ratingCountAndAvg_shouldSetScore() {
            User profile = user(5L);
            when(followRepository.countByFollowed_Id(5L)).thenReturn(0L);
            when(followRepository.countByFollower_Id(5L)).thenReturn(0L);
            when(listingRepository.countBySeller_IdAndStatus(5L, "ACTIVE")).thenReturn(0L);
            when(reviewRepository.countByReviewee_Id(5L)).thenReturn(2L);
            when(reviewRepository.findAverageRatingByReviewee_Id(5L)).thenReturn(4.126);

            UserProfileResponse out = service.buildProfileForViewer(profile, null);
            assertEquals(new BigDecimal("4.13"), out.getReputationScore());
        }

        @Test
        @DisplayName("viewer khác profile -> set isFollowed + block flags")
        void viewerOther_shouldSetFlags() {
            User profile = user(5L);
            when(followRepository.countByFollowed_Id(5L)).thenReturn(0L);
            when(followRepository.countByFollower_Id(5L)).thenReturn(0L);
            when(listingRepository.countBySeller_IdAndStatus(5L, "ACTIVE")).thenReturn(0L);
            when(reviewRepository.countByReviewee_Id(5L)).thenReturn(0L);

            when(followRepository.existsByFollower_IdAndFollowed_Id(9L, 5L)).thenReturn(true);
            when(blockService.isBlockedByCurrentUser(9L, 5L)).thenReturn(true);
            when(blockService.isBlockedByCurrentUser(5L, 9L)).thenReturn(false);

            UserProfileResponse out = service.buildProfileForViewer(profile, 9L);
            assertEquals(Boolean.TRUE, out.getIsFollowedByViewer());
            assertEquals(Boolean.TRUE, out.getIsBlockedByViewer());
            assertEquals(Boolean.FALSE, out.getHasBlockedViewer());
        }
    }
}

