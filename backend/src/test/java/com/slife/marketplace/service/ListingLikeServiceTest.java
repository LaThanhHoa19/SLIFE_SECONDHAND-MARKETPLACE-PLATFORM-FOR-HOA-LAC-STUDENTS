package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.dto.response.ToggleLikeResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingLike;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingLikeRepository;
import com.slife.marketplace.repository.ListingRepository;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
class ListingLikeServiceTest {

    @Mock private ListingLikeRepository likeRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private ListingService listingService;
    @Mock private BlockService blockService;
    @Mock private NotificationService notificationService;

    private ListingLikeService service;

    @BeforeEach
    void setUp() {
        service = new ListingLikeService(likeRepository, listingRepository, listingService, blockService, notificationService);
    }

    private static User user(long id, String status) {
        User u = new User();
        u.setId(id);
        u.setStatus(status);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    private static Listing listing(long id, User seller) {
        Listing l = new Listing();
        l.setId(id);
        l.setSeller(seller);
        l.setCreatedAt(Instant.now());
        l.setUpdatedAt(Instant.now());
        return l;
    }

    @Nested
    @DisplayName("Function: toggle")
    class ToggleGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - user null")
        void utcId01_shouldThrowUnauthorized_whenUserNull() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(null, 1L));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - user banned")
        void utcId02_shouldThrowUserRestricted_whenUserBanned() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "BANNED"), 1L));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - listing not found")
        void utcId03_shouldThrowListingNotFound_whenListingMissing() {
            when(listingRepository.findById(1L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(user(1L, "ACTIVE"), 1L));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Positive] - already liked then unlike")
        void utcId04_shouldUnlike_whenAlreadyLiked() {
            User me = user(1L, "ACTIVE");
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, user(2L, "ACTIVE"))));
            when(likeRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(true);
            when(likeRepository.countByListing_Id(10L)).thenReturn(7L);

            ToggleLikeResponse out = service.toggle(me, 10L);

            assertFalse(out.liked());
            assertEquals(7L, out.likeCount());
            verify(likeRepository).deleteByUser_IdAndListing_Id(1L, 10L);
            verify(notificationService, never()).notifyListingLiked(any(), any(), anyLong());
        }

        @Test
        @DisplayName("UTCID05 [Negative] - blocked with seller")
        void utcId05_shouldThrowFollowBlocked_whenBlockedEitherDirection() {
            User me = user(1L, "ACTIVE");
            Listing l = listing(10L, user(2L, "ACTIVE"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(likeRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.toggle(me, 10L));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
            verify(likeRepository, never()).save(any());
        }

        @Test
        @DisplayName("UTCID06 [Positive] - like other seller listing")
        void utcId06_shouldLikeAndNotify_whenValidAndNotOwnListing() {
            User me = user(1L, "ACTIVE");
            User seller = user(2L, "ACTIVE");
            Listing l = listing(10L, seller);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(likeRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(likeRepository.countByListing_Id(10L)).thenReturn(8L);

            ToggleLikeResponse out = service.toggle(me, 10L);

            assertTrue(out.liked());
            assertEquals(8L, out.likeCount());
            verify(likeRepository).save(any());
            verify(notificationService).notifyListingLiked(seller, me, 10L);
        }

        @Test
        @DisplayName("UTCID07 [Positive] - like own listing")
        void utcId07_shouldLikeWithoutNotify_whenOwnListing() {
            User me = user(1L, "ACTIVE");
            Listing l = listing(10L, me);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(likeRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);
            when(likeRepository.countByListing_Id(10L)).thenReturn(1L);

            ToggleLikeResponse out = service.toggle(me, 10L);

            assertTrue(out.liked());
            assertEquals(1L, out.likeCount());
            verify(notificationService, never()).notifyListingLiked(any(), any(), anyLong());
        }
    }

    @Nested
    @DisplayName("Function: getLikedListings")
    class GetLikedListingsGroup {

        @Test
        @DisplayName("UTCID01 [Boundary] - page and size are clamped")
        void utcId01_shouldClampPageAndSize_whenInputOutOfRange() {
            User me = user(1L, "ACTIVE");
            Listing l = listing(10L, user(2L, "ACTIVE"));
            ListingLike ll = new ListingLike();
            ll.setListing(l);
            Page<ListingLike> page = new PageImpl<>(List.of(ll), PageRequest.of(0, 1), 1);
            when(likeRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(page);

            ListingResponse resp = mock(ListingResponse.class);
            when(listingService.buildListingResponse(eq(l), eq(me), eq(false))).thenReturn(resp);

            PagedResponse<ListingResponse> out = service.getLikedListings(me, -1, 0);

            assertEquals(1, out.getContent().size());
            verify(likeRepository).findByUser_IdOrderByCreatedAtDesc(eq(1L), argThat(pr ->
                    pr.getPageNumber() == 0 && pr.getPageSize() == 1));
        }

        @Test
        @DisplayName("UTCID02 [Boundary] - size above max is capped at 20")
        void utcId02_shouldCapSizeTo20_whenSizeTooLarge() {
            User me = user(1L, "ACTIVE");
            Page<ListingLike> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
            when(likeRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(page);

            service.getLikedListings(me, 0, 100);

            verify(likeRepository).findByUser_IdOrderByCreatedAtDesc(eq(1L), argThat(pr -> pr.getPageSize() == 20));
        }

        @Test
        @DisplayName("UTCID03 [Positive] - map liked listing to listing response")
        void utcId03_shouldMapByListingService_whenRepositoryReturnsData() {
            User me = user(1L, "ACTIVE");
            Listing l1 = listing(10L, user(2L, "ACTIVE"));
            Listing l2 = listing(11L, user(3L, "ACTIVE"));
            ListingLike ll1 = new ListingLike();
            ll1.setListing(l1);
            ListingLike ll2 = new ListingLike();
            ll2.setListing(l2);
            Page<ListingLike> page = new PageImpl<>(List.of(ll1, ll2), PageRequest.of(0, 10), 2);
            when(likeRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(page);
            when(listingService.buildListingResponse(eq(l1), eq(me), eq(false))).thenReturn(mock(ListingResponse.class));
            when(listingService.buildListingResponse(eq(l2), eq(me), eq(false))).thenReturn(mock(ListingResponse.class));

            PagedResponse<ListingResponse> out = service.getLikedListings(me, 0, 10);

            assertEquals(2, out.getContent().size());
            verify(listingService).buildListingResponse(l1, me, false);
            verify(listingService).buildListingResponse(l2, me, false);
        }
    }
}
