package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Address;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.AddressRepository;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingLikeRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
import com.slife.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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
    @Mock private UserRepository userRepository;

    private ListingService listingService;

    @BeforeEach
    void setUp() {
        listingService = new ListingService(
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
                contentModerationService,
                userRepository
        );
    }

    @Test
    @DisplayName("getFilteredListings returns one mapped item")
    void getFilteredListings_shouldReturnPagedListingResponses() {
        User seller = new User();
        seller.setId(1L);
        seller.setFullName("Alice");
        seller.setAvatarUrl("https://example.com/alice.jpg");

        Listing listing = new Listing();
        listing.setId(10L);
        listing.setTitle("iPhone 12");
        listing.setSeller(seller);
        listing.setDescription("Máy còn dùng ổn");
        listing.setPrice(new BigDecimal("5000000"));
        listing.setItemCondition("USED_GOOD");
        listing.setStatus("ACTIVE");
        listing.setIsGiveaway(false);
        listing.setCreatedAt(Instant.parse("2025-01-01T10:00:00Z"));

        Address address = new Address();
        address.setLocationName("Hòa Lạc");
        listing.setPickupAddress(address);

        ListingImage image = new ListingImage();
        image.setId(555L);
        image.setImageUrl("https://example.com/iphone.jpg");

        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(listing)));
        when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(10L)).thenReturn(List.of(image));

        PagedResponse<ListingResponse> result = listingService.getFilteredListings(null, null, null, "createdAt,desc", 0, 10, null);

        assertEquals(1, result.getContent().size());
        ListingResponse response = result.getContent().get(0);
        assertEquals(10L, response.getId());
        assertEquals("iPhone 12", response.getTitle());
        assertEquals(List.of("https://example.com/iphone.jpg"), response.getImages());
        assertEquals("Hòa Lạc", response.getLocation());
        assertFalse(response.getIsSaved());
        assertFalse(response.getIsFollowed());
    }

    @Test
    @DisplayName("getFilteredListings sanitizes pagination")
    void should_SanitizePagination_When_InputIsOutOfRange() {
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        listingService.getFilteredListings(null, null, null, null, -1, 100, null);

        org.mockito.ArgumentCaptor<Pageable> captor = org.mockito.ArgumentCaptor.forClass(Pageable.class);
        verify(listingRepository).findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(Instant.class), captor.capture());
        assertEquals(0, captor.getValue().getPageNumber());
        assertEquals(20, captor.getValue().getPageSize());
    }

    @Test
    @DisplayName("getFilteredListings normalizes search and location params")
    void should_NormalizeInputParams_When_Searching() {
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        listingService.getFilteredListings(1L, "  Hoa Lac  ", "   ", null, 0, 10, null);

        org.mockito.ArgumentCaptor<String> locationCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(listingRepository).findByFilters(
                isNull(),
                isNull(),
                any(java.util.Collection.class),
                locationCaptor.capture(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                any(Instant.class),
                any(Pageable.class)
        );
        assertEquals("Hoa Lac", locationCaptor.getValue());
    }

    @Test
    @DisplayName("getFilteredListings handles null params")
    void should_HandleNullParams_Gracefully() {
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        listingService.getFilteredListings(null, null, null, null, 0, 10, null);

        verify(listingRepository).findByFilters(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any(Instant.class), any(Pageable.class));
    }

    @Test
    @DisplayName("getFilteredListings falls back to address text when location name is blank")
    void should_FallbackToAddressText_When_LocationNameIsBlank() {
        Listing listing = new Listing();
        Address address = new Address();
        address.setLocationName("");
        address.setAddressText("Ký túc xá Dom A");
        listing.setPickupAddress(address);

        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(listing)));

        PagedResponse<ListingResponse> result = listingService.getFilteredListings(null, null, null, null, 0, 10, null);
        assertEquals("Ký túc xá Dom A", result.getContent().get(0).getLocation());
    }

    @Test
    @DisplayName("getFilteredListings returns null seller/location when missing")
    void should_ReturnNull_When_MandatoryFieldsAreMissing() {
        Listing listing = new Listing();
        listing.setSeller(null);
        listing.setPickupAddress(null);

        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(listing)));

        PagedResponse<ListingResponse> result = listingService.getFilteredListings(null, null, null, null, 0, 10, null);
        assertNull(result.getContent().get(0).getSellerSummary());
        assertNull(result.getContent().get(0).getLocation());
    }
}
