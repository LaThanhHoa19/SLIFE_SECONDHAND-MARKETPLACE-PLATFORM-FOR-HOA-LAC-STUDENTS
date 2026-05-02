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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    @Nested
    @DisplayName("Function: follow")
    class FollowGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - follow self")
        void utcId01_shouldThrowFollowSelf_whenFollowSelf() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.follow(user(1L), 1L));
            assertEquals(ErrorCode.FOLLOW_SELF, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - blocked relationship")
        void utcId02_shouldThrowFollowBlocked_whenBlockedEitherDirection() {
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(1L, 2L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.follow(user(1L), 2L));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - followed user not found")
        void utcId03_shouldThrowUserNotFound_whenFollowedMissing() {
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(anyLong(), anyLong())).thenReturn(false);
            when(userRepository.findById(2L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> service.follow(user(1L), 2L));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - already following")
        void utcId04_shouldThrowFollowAlready_whenRelationExists() {
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(anyLong(), anyLong())).thenReturn(false);
            when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L)));
            when(followRepository.existsByFollower_IdAndFollowed_Id(1L, 2L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.follow(user(1L), 2L));
            assertEquals(ErrorCode.FOLLOW_ALREADY, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID05 [Positive] - follow success")
        void utcId05_shouldSaveAndNotify_whenFollowSuccess() {
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
    }

    @Nested
    @DisplayName("Function: unfollow")
    class UnfollowGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - not following")
        void utcId01_shouldThrowNotFollowing_whenRelationMissing() {
            when(followRepository.existsByFollower_IdAndFollowed_Id(1L, 2L)).thenReturn(false);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.unfollow(user(1L), 2L));
            assertEquals(ErrorCode.FOLLOW_NOT_FOLLOWING, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - unfollow success")
        void utcId02_shouldDeleteRelation_whenUnfollowSuccess() {
            when(followRepository.existsByFollower_IdAndFollowed_Id(1L, 2L)).thenReturn(true);

            service.unfollow(user(1L), 2L);

            verify(followRepository).deleteByFollower_IdAndFollowed_Id(1L, 2L);
        }
    }

    @Nested
    @DisplayName("Function: getFollowers")
    class GetFollowersGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - profile user id null")
        void utcId01_shouldThrowInvalidInput_whenProfileUserIdNull() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getFollowers(null, 0, 10));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - profile user not found")
        void utcId02_shouldThrowUserNotFound_whenProfileUserNotExists() {
            when(userRepository.existsById(10L)).thenReturn(false);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.getFollowers(10L, 0, 10));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Boundary] - clamp page and size")
        void utcId03_shouldClampPaging_whenPageOrSizeOutOfRange() {
            when(userRepository.existsById(10L)).thenReturn(true);
            Page<FollowUserSummaryResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 1), 0);
            when(followRepository.findFollowerSummariesByFollowedId(eq(10L), any())).thenReturn(page);

            service.getFollowers(10L, -1, 0);

            verify(followRepository).findFollowerSummariesByFollowedId(eq(10L), argThat(pr ->
                    pr.getPageNumber() == 0 && pr.getPageSize() == 1));
        }
    }

    @Nested
    @DisplayName("Function: buildProfileForViewer")
    class BuildProfileForViewerGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - viewer is null")
        void utcId01_shouldSetViewerFlagsNull_whenViewerNull() {
            User profile = user(5L);
            when(followRepository.countByFollowed_Id(5L)).thenReturn(1L);
            when(followRepository.countByFollower_Id(5L)).thenReturn(2L);
            when(listingRepository.countBySeller_IdAndStatus(5L, "ACTIVE")).thenReturn(3L);
            when(reviewRepository.countByReviewee_Id(5L)).thenReturn(0L);

            UserProfileResponse out = service.buildProfileForViewer(profile, null);

            assertNull(out.getIsFollowedByViewer());
            assertNull(out.getIsBlockedByViewer());
            assertNull(out.getHasBlockedViewer());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - viewer is another user")
        void utcId02_shouldSetFollowAndBlockFlags_whenViewerDifferent() {
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

        @Test
        @DisplayName("UTCID03 [Boundary] - rating rounded to two decimals")
        void utcId03_shouldRoundReputation_whenAverageRatingExists() {
            User profile = user(5L);
            when(followRepository.countByFollowed_Id(5L)).thenReturn(0L);
            when(followRepository.countByFollower_Id(5L)).thenReturn(0L);
            when(listingRepository.countBySeller_IdAndStatus(5L, "ACTIVE")).thenReturn(0L);
            when(reviewRepository.countByReviewee_Id(5L)).thenReturn(2L);
            when(reviewRepository.findAverageRatingByReviewee_Id(5L)).thenReturn(4.126);

            UserProfileResponse out = service.buildProfileForViewer(profile, null);

            assertEquals(new BigDecimal("4.13"), out.getReputationScore());
        }
    }
}
