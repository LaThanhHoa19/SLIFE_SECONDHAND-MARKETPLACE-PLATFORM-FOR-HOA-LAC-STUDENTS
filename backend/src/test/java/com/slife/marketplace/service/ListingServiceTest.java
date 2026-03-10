/**
 * Mục đích: Test skeleton.
 * TODO: Hoàn thiện kịch bản test theo use case.
 */
package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class ListingServiceTest {
    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;

    @Mock
    private CategoryRepository categoryRepository;


    private ListingService listingService;

    @BeforeEach
    void setUp() {
        listingService = new ListingService(listingRepository, categoryRepository, listingImageRepository, Path.of("/tmp"));
    }


    @Test
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
        image.setImageUrl("https://example.com/iphone.jpg");

        Page<Listing> pageData = new PageImpl<>(List.of(listing), PageRequest.of(0, 10), 1);

        when(listingRepository.findByFilters(isNull(), isNull(), isNull(), any(PageRequest.class)))
                .thenReturn(pageData);
        when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(10L))
                .thenReturn(List.of(image));

        PagedResponse<ListingResponse> result = listingService.getFilteredListings(null, null, null,
                "createdAt,desc", 0, 10, null);
        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getTotalElements());

        ListingResponse listingResponse = result.getContent().get(0);
        assertEquals(10L, listingResponse.getId());
        assertEquals("iPhone 12", listingResponse.getTitle());
        assertEquals(List.of("https://example.com/iphone.jpg"), listingResponse.getImages());
        assertEquals("Máy còn dùng ổn", listingResponse.getDescription());
        assertEquals(new BigDecimal("5000000"), listingResponse.getPrice());
        assertEquals("USED_GOOD", listingResponse.getItemCondition());
        assertEquals("ACTIVE", listingResponse.getStatus());
        assertEquals(false, listingResponse.getIsGiveaway());
        assertEquals("Hòa Lạc", listingResponse.getLocation());
        assertEquals(Instant.parse("2025-01-01T10:00:00Z"), listingResponse.getCreatedAt());

        @SuppressWarnings("unchecked")
        Map<String, Object> sellerSummary = (Map<String, Object>) listingResponse.getSellerSummary();
        assertEquals(1L, sellerSummary.get("userId"));
        assertEquals("Alice", sellerSummary.get("fullName"));
        assertFalse(listingResponse.getIsSaved());
        assertFalse(listingResponse.getIsFollowed());
    }
}