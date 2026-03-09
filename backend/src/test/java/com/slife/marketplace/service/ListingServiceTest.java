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
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class ListingServiceTest {
    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;

    @InjectMocks
    private ListingService listingService;

    @Test
    void getListings_shouldReturnPagedListingResponses() {
        User seller = new User();
        seller.setId(1L);
        seller.setFullName("Alice");
        seller.setAvatarUrl("https://example.com/alice.jpg");

        Listing listing = new Listing();
        listing.setId(10L);
        listing.setTitle("iPhone 12");
        listing.setSeller(seller);

        ListingImage image = new ListingImage();
        image.setImageUrl("https://example.com/iphone.jpg");

        Page<Listing> pageData = new PageImpl<>(List.of(listing), PageRequest.of(0, 10), 1);

        when(listingRepository.findAll(PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))))
                .thenReturn(pageData);
        when(listingImageRepository.findByListingIdOrderByDisplayOrderAsc(10L))
                .thenReturn(List.of(image));

        PagedResponse<ListingResponse> result = listingService.getListings(0, 10);

        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getTotalElements());

        ListingResponse listingResponse = result.getContent().get(0);
        assertEquals(10L, listingResponse.getId());
        assertEquals("iPhone 12", listingResponse.getTitle());
        assertEquals(List.of("https://example.com/iphone.jpg"), listingResponse.getImages());

        @SuppressWarnings("unchecked")
        Map<String, Object> sellerSummary = (Map<String, Object>) listingResponse.getSellerSummary();
        assertEquals(1L, sellerSummary.get("id"));
        assertEquals("Alice", sellerSummary.get("fullName"));
        assertFalse(listingResponse.getIsSaved());
        assertFalse(listingResponse.getIsFollowed());
    }
}