package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.SavedListing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
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
class SavedListingServiceTest {

    @Mock
    private SavedListingRepository savedListingRepository;
    @Mock
    private ListingRepository listingRepository;
    @Mock
    private ListingService listingService;
    @Mock
    private BlockService blockService;

    private SavedListingService service;

    @BeforeEach
    void setUp() {
        service = new SavedListingService(savedListingRepository, listingRepository, listingService, blockService);
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    private static Listing listing(long id, User seller, String status) {
        Listing l = new Listing();
        l.setId(id);
        l.setSeller(seller);
        l.setStatus(status);
        l.setCreatedAt(Instant.now());
        l.setUpdatedAt(Instant.now());
        return l;
    }

    @Nested
    @DisplayName("Function: save")
    class SaveGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - listing not found")
        void utcId01_shouldThrowListingNotFound_whenListingMissing() {
            when(listingRepository.findById(10L)).thenReturn(Optional.empty());

            assertEquals(ErrorCode.LISTING_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.save(user(1L), 10L)).getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - listing is not ACTIVE")
        void utcId02_shouldThrowListingNotFound_whenListingNotActive() {
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, user(2L), "HIDDEN")));

            assertEquals(ErrorCode.LISTING_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.save(user(1L), 10L)).getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - blocked with seller")
        void utcId03_shouldThrowFollowBlocked_whenBlockedEitherDirection() {
            User me = user(1L);
            User seller = user(2L);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, seller, "ACTIVE")));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.save(me, 10L));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
            verify(savedListingRepository, never()).save(any());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - listing already saved")
        void utcId04_shouldThrowSavedListingAlready_whenAlreadySaved() {
            User me = user(1L);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, user(2L), "ACTIVE")));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(true);

            assertEquals(ErrorCode.SAVED_LISTING_ALREADY,
                    assertThrows(SlifeException.class, () -> service.save(me, 10L)).getErrorCode());
        }

        @Test
        @DisplayName("UTCID05 [Positive] - save success")
        void utcId05_shouldSave_whenAllBusinessConditionsAreMet() {
            User me = user(1L);
            Listing l = listing(10L, user(2L), "ACTIVE");
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);
            when(savedListingRepository.save(any(SavedListing.class))).thenAnswer(inv -> inv.getArgument(0));

            service.save(me, 10L);

            verify(savedListingRepository).save(argThat(s -> s.getUser() == me && s.getListing() == l));
        }
    }

    @Nested
    @DisplayName("Function: unsave")
    class UnsaveGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - listing is not in saved list")
        void utcId01_shouldThrowSavedListingNotSaved_whenNotSavedYet() {
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);

            assertEquals(ErrorCode.SAVED_LISTING_NOT_SAVED,
                    assertThrows(SlifeException.class, () -> service.unsave(user(1L), 10L)).getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - unsave success")
        void utcId02_shouldDeleteSavedListing_whenSavedExists() {
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(true);

            service.unsave(user(1L), 10L);

            verify(savedListingRepository).deleteByUser_IdAndListing_Id(1L, 10L);
        }
    }

    @Nested
    @DisplayName("Function: getSavedListings")
    class GetSavedListingsGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - filter blocked and null listing, normalize page/size")
        void utcId01_shouldFilterAndNormalize_whenInputPageSizeInvalid() {
            User me = user(1L);
            Listing l1 = listing(10L, user(2L), "ACTIVE");
            Listing l2 = listing(11L, user(3L), "ACTIVE");

            SavedListing s1 = new SavedListing();
            s1.setListing(l1);
            SavedListing s2 = new SavedListing();
            s2.setListing(null);
            SavedListing s3 = new SavedListing();
            s3.setListing(l2);

            Page<SavedListing> p = new PageImpl<>(List.of(s1, s2, s3), PageRequest.of(0, 1), 3);
            when(savedListingRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(p);
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            when(blockService.isBlockedEitherDirection(1L, 3L)).thenReturn(false);

            ListingResponse resp2 = mock(ListingResponse.class);
            when(listingService.buildListingResponse(eq(l2), eq(me), eq(true))).thenReturn(resp2);

            PagedResponse<ListingResponse> out = service.getSavedListings(me, -1, 0);
            assertEquals(1, out.getContent().size());
            verify(savedListingRepository).findByUser_IdOrderByCreatedAtDesc(eq(1L), argThat(pr ->
                    pr.getPageNumber() == 0 && pr.getPageSize() == 1));
        }

        @Test
        @DisplayName("UTCID02 [Positive] - own listing bypasses block check")
        void utcId02_shouldBypassBlockCheck_whenSellerIsCurrentUser() {
            User me = user(1L);
            Listing own = listing(10L, me, "ACTIVE");
            SavedListing s = new SavedListing();
            s.setListing(own);
            Page<SavedListing> p = new PageImpl<>(List.of(s), PageRequest.of(0, 1), 1);
            when(savedListingRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(p);

            ListingResponse resp = mock(ListingResponse.class);
            when(listingService.buildListingResponse(eq(own), eq(me), eq(true))).thenReturn(resp);

            PagedResponse<ListingResponse> out = service.getSavedListings(me, 0, 1);
            assertEquals(1, out.getContent().size());
            verifyNoInteractions(blockService);
        }

        @Test
        @DisplayName("UTCID03 [Boundary] - size over max is clamped to 20")
        void utcId03_shouldClampSizeTo20_whenRequestedSizeTooLarge() {
            User me = user(1L);
            Page<SavedListing> p = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
            when(savedListingRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(p);

            PagedResponse<ListingResponse> out = service.getSavedListings(me, 0, 999);

            assertEquals(20, out.getSize());
            verify(savedListingRepository).findByUser_IdOrderByCreatedAtDesc(eq(1L), argThat(pr ->
                    pr.getPageNumber() == 0 && pr.getPageSize() == 20));
        }
    }
}

