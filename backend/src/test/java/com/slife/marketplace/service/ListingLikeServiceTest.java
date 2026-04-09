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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("toggle")
    class Toggle {

        @Test
        @DisplayName("user null -> UNAUTHORIZED")
        void userNull_shouldThrow() {
            assertEquals(ErrorCode.UNAUTHORIZED,
                    assertThrows(SlifeException.class, () -> service.toggle(null, 1L)).getErrorCode());
        }

        @Test
        @DisplayName("user BANNED/RESTRICTED -> USER_BANNED_OR_RESTRICTED")
        void bannedRestricted_shouldThrow() {
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED,
                    assertThrows(SlifeException.class, () -> service.toggle(user(1L, "BANNED"), 1L)).getErrorCode());
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED,
                    assertThrows(SlifeException.class, () -> service.toggle(user(1L, "RESTRICTED"), 1L)).getErrorCode());
        }

        @Test
        @DisplayName("listing not found -> LISTING_NOT_FOUND")
        void listingMissing_shouldThrow() {
            when(listingRepository.findById(1L)).thenReturn(Optional.empty());
            assertEquals(ErrorCode.LISTING_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.toggle(user(1L, "ACTIVE"), 1L)).getErrorCode());
        }

        @Test
        @DisplayName("đã like -> unlike: delete + count")
        void alreadyLiked_shouldUnlike() {
            User me = user(1L, "ACTIVE");
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, user(2L, "ACTIVE"))));
            when(likeRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(true);
            when(likeRepository.countByListing_Id(10L)).thenReturn(7L);

            ToggleLikeResponse out = service.toggle(me, 10L);

            assertFalse(out.isLiked());
            assertEquals(7L, out.getLikeCount());
            verify(likeRepository).deleteByUser_IdAndListing_Id(1L, 10L);
            verify(notificationService, never()).notifyListingLiked(any(), any(), anyLong());
        }

        @Test
        @DisplayName("block either direction giữa user và seller -> FOLLOW_BLOCKED")
        void blocked_shouldThrow() {
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
        @DisplayName("happy path: like -> save + notify (if not own) + count")
        void like_shouldSaveNotifyAndCount() {
            User me = user(1L, "ACTIVE");
            User seller = user(2L, "ACTIVE");
            Listing l = listing(10L, seller);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(likeRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(likeRepository.countByListing_Id(10L)).thenReturn(8L);

            ToggleLikeResponse out = service.toggle(me, 10L);

            assertTrue(out.isLiked());
            assertEquals(8L, out.getLikeCount());
            verify(likeRepository).save(any());
            verify(notificationService).notifyListingLiked(seller, me, 10L);
        }

        @Test
        @DisplayName("like own listing -> không notify")
        void likeOwnListing_shouldNotNotify() {
            User me = user(1L, "ACTIVE");
            Listing l = listing(10L, me);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(likeRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);
            when(likeRepository.countByListing_Id(10L)).thenReturn(1L);

            service.toggle(me, 10L);

            verify(notificationService, never()).notifyListingLiked(any(), any(), anyLong());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("getLikedListings")
    class LikedListings {

        @Test
        @DisplayName("clamp page/size + map bằng listingService.buildListingResponse")
        void clampAndMap_shouldWork() {
            User me = user(1L, "ACTIVE");
            Listing l = listing(10L, user(2L, "ACTIVE"));
            ListingLike ll = new ListingLike();
            ll.setListing(l);
            Page<ListingLike> p = new PageImpl<>(List.of(ll), PageRequest.of(0, 1), 1);
            when(likeRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(p);

            ListingResponse resp = mock(ListingResponse.class);
            when(listingService.buildListingResponse(eq(l), eq(me), eq(false))).thenReturn(resp);

            PagedResponse<ListingResponse> out = service.getLikedListings(me, -1, 0);
            assertEquals(1, out.getContent().size());
            verify(likeRepository).findByUser_IdOrderByCreatedAtDesc(eq(1L), argThat(pr ->
                    pr.getPageNumber() == 0 && pr.getPageSize() == 1));
        }
    }
}

