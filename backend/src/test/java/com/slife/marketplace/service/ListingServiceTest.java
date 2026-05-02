package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.AddressRepository;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingLikeRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock private ListingRepository listingRepository;
    @Mock private ListingImageRepository listingImageRepository;
    @Mock private SavedListingRepository savedListingRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private FollowService followService;
    @Mock private BlockService blockService;
    @Mock private ListingLikeRepository listingLikeRepository;
    @Mock private ListingImageService listingImageService;
    @Mock private ConfigService configService;
    @Mock private NotificationService notificationService;
    @Mock private ListingExpiryBatchService listingExpiryBatchService;
    @Mock private SystemEmailService systemEmailService;
    @Mock private ContentModerationService contentModerationService;

    private ListingService service;

    @BeforeEach
    void setUp() {
        service = new ListingService(
                listingRepository,
                listingImageRepository,
                savedListingRepository,
                categoryRepository,
                addressRepository,
                followService,
                blockService,
                listingLikeRepository,
                listingImageService,
                configService,
                notificationService,
                listingExpiryBatchService,
                systemEmailService,
                contentModerationService
        );
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("User " + id);
        return u;
    }

    @Nested
    @DisplayName("Function: createListingWithImages")
    class CreateListingWithImagesGroup {
        @Test
        @DisplayName("UTCID01 [Negative] - seller null")
        void utcId01_shouldThrowUnauthorized_whenSellerNull() {
            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> service.createListingWithImages(null, new CreateListingRequest(), List.of())
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - active listing without image")
        void utcId02_shouldThrowInvalidInput_whenActiveWithoutImages() {
            User seller = user(10L);
            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);
            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> service.createListingWithImages(seller, req, List.of())
            );
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - draft listing with one image")
        void utcId03_shouldCreateDraftAndUploadImages_whenInputValid() {
            User seller = user(10L);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> {
                Listing l = inv.getArgument(0);
                l.setId(888L);
                return l;
            });
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(888L)).thenReturn(List.of());
            when(listingLikeRepository.countByListing_Id(888L)).thenReturn(0L);
            when(listingLikeRepository.existsByUser_IdAndListing_Id(10L, 888L)).thenReturn(false);
            MultipartFile f1 = mock(MultipartFile.class);
            when(f1.isEmpty()).thenReturn(false);
            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(true);

            ListingResponse out = service.createListingWithImages(seller, req, List.of(f1));
            assertEquals("DRAFT", out.getStatus());
            verify(listingImageService).uploadListingImages(888L, List.of(f1), seller);
            verify(notificationService, never()).notifyFollowersAboutNewListing(any(), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Function: repostListing")
    class RepostListingGroup {
        @Test
        @DisplayName("UTCID01 [Negative] - listing not found")
        void utcId01_shouldThrowListingNotFound_whenSourceMissing() {
            User seller = user(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.repostListing(404L, seller));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - not owner")
        void utcId02_shouldThrowForbidden_whenNotOwner() {
            User owner = user(10L);
            User other = user(11L);
            Listing src = new Listing();
            src.setId(17L);
            src.setSeller(owner);
            src.setStatus("EXPIRED");
            src.setExpirationDate(Instant.now().minus(1, ChronoUnit.DAYS));
            when(listingRepository.findById(17L)).thenReturn(Optional.of(src));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.repostListing(17L, other));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - clone expired listing to active")
        void utcId03_shouldCloneToActive_whenExpired() {
            User seller = user(10L);
            Listing src = new Listing();
            src.setId(17L);
            src.setSeller(seller);
            src.setStatus("EXPIRED");
            src.setTitle("Laptop");
            src.setDescription("desc");
            src.setPrice(new BigDecimal("1000"));
            src.setItemCondition("USED_GOOD");
            src.setPurpose("SALE");
            src.setIsGiveaway(false);
            src.setExpirationDate(Instant.now().minus(1, ChronoUnit.DAYS));
            when(listingRepository.findById(17L)).thenReturn(Optional.of(src));
            when(configService.getIntConfigValue(eq("MAX_ACTIVE_LISTINGS_PER_USER"), anyInt())).thenReturn(0);
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(30);
            when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> {
                Listing l = inv.getArgument(0);
                if (l.getId() == null) {
                    l.setId(999L);
                }
                return l;
            });
            ListingImage img = new ListingImage();
            img.setImageUrl("https://cdn/a.jpg");
            img.setDisplayOrder(0);
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(17L)).thenReturn(List.of(img));

            Long newId = service.repostListing(17L, seller);
            assertEquals(999L, newId);
            verify(listingRepository, times(2)).save(any(Listing.class));
            verify(listingImageRepository).saveAll(any());
        }
    }

    @Nested
    @DisplayName("Function: hideListing")
    class HideListingGroup {
        @Test
        @DisplayName("UTCID01 [Negative] - listing not found")
        void utcId01_shouldThrowListingNotFound_whenMissing() {
            when(listingRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.hideListing(1L, user(10L)));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - status not ACTIVE")
        void utcId02_shouldThrowInvalidInput_whenNotActive() {
            User seller = user(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(seller);
            l.setStatus("HIDDEN");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.hideListing(1L, seller));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - ACTIVE to HIDDEN")
        void utcId03_shouldSetHidden_whenValid() {
            User seller = user(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(seller);
            l.setStatus("ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> inv.getArgument(0));
            service.hideListing(1L, seller);
            assertEquals("HIDDEN", l.getStatus());
        }
    }

    @Nested
    @DisplayName("Function: renewListing")
    class RenewListingGroup {
        @Test
        @DisplayName("UTCID01 [Negative] - too early to renew")
        void utcId01_shouldThrowNotRenewable_whenMoreThan7Days() {
            User seller = user(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(seller);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().plus(20, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.renewListing(1L, seller));
            assertEquals(ErrorCode.LISTING_NOT_RENEWABLE, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - renew when within 7 days")
        void utcId02_shouldExtendExpiration_whenWithinWindow() {
            User seller = user(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(seller);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().plus(3, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(30);
            when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> inv.getArgument(0));
            service.renewListing(1L, seller);
            assertNotNull(l.getExpirationDate());
            verify(listingRepository).save(l);
        }
    }
}
