package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ReviewResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.Review;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    private ReviewService service;

    @BeforeEach
    void setUp() {
        service = new ReviewService(reviewRepository);
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setFullName("User " + id);
        u.setAvatarUrl("avatar-" + id);
        return u;
    }

    @Nested
    @DisplayName("Function: getUserReviews")
    class GetUserReviewsGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - empty review list returns empty response")
        void utcId01_shouldReturnEmptyList_whenNoReviewExists() {
            when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(7L)).thenReturn(Collections.emptyList());

            List<ReviewResponse> result = service.getUserReviews(7L);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - map base fields and reviewer info")
        void utcId02_shouldMapBasicAndReviewerFields() {
            Review r = new Review();
            r.setId(1L);
            r.setRating((byte) 5);
            r.setComment("Great trade");
            r.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
            r.setReviewer(user(9L));

            when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(5L)).thenReturn(List.of(r));

            ReviewResponse out = service.getUserReviews(5L).get(0);

            assertEquals(1L, out.getId());
            assertEquals(5, out.getRating().intValue());
            assertEquals("Great trade", out.getComment());
            assertEquals(9L, out.getReviewerId());
            assertEquals("User 9", out.getReviewerName());
            assertEquals("avatar-9", out.getReviewerAvatar());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - map listing fields and first image")
        void utcId03_shouldMapListingFieldsAndFirstImage_whenConversationHasListing() {
            Listing listing = new Listing();
            listing.setId(10L);
            listing.setTitle("Laptop");
            listing.setPrice(BigDecimal.valueOf(12.5));

            ListingImage img1 = new ListingImage();
            img1.setImageUrl("img1");
            ListingImage img2 = new ListingImage();
            img2.setImageUrl("img2");
            listing.setImages(List.of(img1, img2));

            Conversation conv = new Conversation();
            conv.setListing(listing);

            Review r = new Review();
            r.setId(2L);
            r.setRating((byte) 4);
            r.setCreatedAt(Instant.parse("2026-01-02T00:00:00Z"));
            r.setConversation(conv);

            when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(5L)).thenReturn(List.of(r));

            ReviewResponse out = service.getUserReviews(5L).get(0);

            assertEquals(10L, out.getListingId());
            assertEquals("Laptop", out.getListingTitle());
            assertEquals(BigDecimal.valueOf(12.5), out.getListingPrice());
            assertEquals("img1", out.getListingImage());
        }

        @Test
        @DisplayName("UTCID04 [Boundary] - null reviewer and missing listing keep related fields null")
        void utcId04_shouldKeepOptionalFieldsNull_whenReviewerOrListingMissing() {
            Conversation conv = new Conversation();
            conv.setListing(null);

            Review r = new Review();
            r.setId(3L);
            r.setRating((byte) 3);
            r.setCreatedAt(Instant.parse("2026-01-03T00:00:00Z"));
            r.setReviewer(null);
            r.setConversation(conv);

            when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(5L)).thenReturn(List.of(r));

            ReviewResponse out = service.getUserReviews(5L).get(0);

            assertNull(out.getReviewerId());
            assertNull(out.getReviewerName());
            assertNull(out.getReviewerAvatar());
            assertNull(out.getListingId());
            assertNull(out.getListingTitle());
            assertNull(out.getListingPrice());
            assertNull(out.getListingImage());
        }

        @Test
        @DisplayName("UTCID05 [Boundary] - listing without images sets listingImage to null")
        void utcId05_shouldSetListingImageNull_whenListingHasNoImages() {
            Listing listing = new Listing();
            listing.setId(20L);
            listing.setTitle("No image item");
            listing.setPrice(BigDecimal.ONE);
            listing.setImages(Collections.emptyList());

            Conversation conv = new Conversation();
            conv.setListing(listing);

            Review r = new Review();
            r.setId(4L);
            r.setRating((byte) 5);
            r.setCreatedAt(Instant.now());
            r.setConversation(conv);

            when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(2L)).thenReturn(List.of(r));

            ReviewResponse out = service.getUserReviews(2L).get(0);

            assertEquals(20L, out.getListingId());
            assertNull(out.getListingImage());
        }
    }
}

