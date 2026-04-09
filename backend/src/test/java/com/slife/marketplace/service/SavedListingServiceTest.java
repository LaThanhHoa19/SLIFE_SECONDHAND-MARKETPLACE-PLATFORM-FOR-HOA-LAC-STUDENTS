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

    @Mock private SavedListingRepository savedListingRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private ListingService listingService;
    @Mock private BlockService blockService;

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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("save")
    class Save {
        @Test
        @DisplayName("listing not found -> LISTING_NOT_FOUND")
        void listingMissing_shouldThrow() {
            when(listingRepository.findById(10L)).thenReturn(Optional.empty());
            assertEquals(ErrorCode.LISTING_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.save(user(1L), 10L)).getErrorCode());
        }

        @Test
        @DisplayName("listing status != ACTIVE -> LISTING_NOT_FOUND")
        void listingNotActive_shouldThrow() {
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, user(2L), "HIDDEN")));
            assertEquals(ErrorCode.LISTING_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.save(user(1L), 10L)).getErrorCode());
        }

        @Test
        @DisplayName("blocked between user & seller -> FOLLOW_BLOCKED")
        void blocked_shouldThrow() {
            User me = user(1L);
            User seller = user(2L);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, seller, "ACTIVE")));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class, () -> service.save(me, 10L));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
            verify(savedListingRepository, never()).save(any());
        }

        @Test
        @DisplayName("already saved -> SAVED_LISTING_ALREADY")
        void alreadySaved_shouldThrow() {
            User me = user(1L);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, user(2L), "ACTIVE")));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(true);
            assertEquals(ErrorCode.SAVED_LISTING_ALREADY,
                    assertThrows(SlifeException.class, () -> service.save(me, 10L)).getErrorCode());
        }

        @Test
        @DisplayName("happy path -> save row")
        void happyPath_shouldSave() {
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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("unsave")
    class Unsave {
        @Test
        @DisplayName("not saved -> SAVED_LISTING_NOT_SAVED")
        void notSaved_shouldThrow() {
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(false);
            assertEquals(ErrorCode.SAVED_LISTING_NOT_SAVED,
                    assertThrows(SlifeException.class, () -> service.unsave(user(1L), 10L)).getErrorCode());
        }

        @Test
        @DisplayName("happy path -> deleteByUserAndListing")
        void happyPath_shouldDelete() {
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(true);
            service.unsave(user(1L), 10L);
            verify(savedListingRepository).deleteByUser_IdAndListing_Id(1L, 10L);
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("getSavedListings/isSaved")
    class GetSaved {
        @Test
        @DisplayName("clamp page/size + filter null listing + filter blocked sellers")
        void clampAndFilter_shouldWork() {
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
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);  // filter out l1
            when(blockService.isBlockedEitherDirection(1L, 3L)).thenReturn(false); // keep l2

            ListingResponse resp2 = mock(ListingResponse.class);
            when(listingService.buildListingResponse(eq(l2), eq(me), eq(true))).thenReturn(resp2);

            PagedResponse<ListingResponse> out = service.getSavedListings(me, -1, 0);
            assertEquals(1, out.getContent().size());
            verify(savedListingRepository).findByUser_IdOrderByCreatedAtDesc(eq(1L), argThat(pr ->
                    pr.getPageNumber() == 0 && pr.getPageSize() == 1));
        }

        @Test
        @DisplayName("seller==currentUser -> không check block")
        void sellerIsUser_shouldBypassBlockFilter() {
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
        @DisplayName("isSaved delegates to repository")
        void isSaved_delegates() {
            when(savedListingRepository.existsByUser_IdAndListing_Id(1L, 10L)).thenReturn(true);
            assertTrue(service.isSaved(1L, 10L));
        }
    }
}

