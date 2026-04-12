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

    @Mock private ReviewRepository reviewRepository;

    private ReviewService service;

    @BeforeEach
    void setUp() {
        service = new ReviewService(reviewRepository);
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setFullName("U" + id);
        u.setAvatarUrl("ava" + id);
        return u;
    }

    @Test
    @DisplayName("getUserReviews: ánh xạ trường cơ bản; an toàn null (reviewer/conversation)")
    void getUserReviews_mapsAndNullSafe() {
        Review r1 = new Review();
        r1.setId(1L);
        r1.setRating((byte) 5);
        r1.setComment("good");
        r1.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        r1.setReviewer(user(9L));

        Review r2 = new Review();
        r2.setId(2L);
        r2.setRating((byte) 4);
        r2.setComment(null);
        r2.setCreatedAt(Instant.parse("2026-01-02T00:00:00Z"));
        r2.setReviewer(null);
        r2.setConversation(null);

        when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(5L)).thenReturn(List.of(r1, r2));

        List<ReviewResponse> out = service.getUserReviews(5L);
        assertEquals(2, out.size());
        assertEquals(1L, out.get(0).getId());
        assertEquals(5, out.get(0).getRating().intValue());
        assertEquals("good", out.get(0).getComment());
        assertEquals(9L, out.get(0).getReviewerId());
        assertEquals("U9", out.get(0).getReviewerName());
        assertEquals("ava9", out.get(0).getReviewerAvatar());

        assertEquals(2L, out.get(1).getId());
        assertNull(out.get(1).getReviewerId());
        assertNull(out.get(1).getListingId());
    }

    @Test
    @DisplayName("getUserReviews: ánh xạ tin đăng + ảnh đầu tiên nếu có")
    void getUserReviews_mapsListingAndImage() {
        Listing listing = new Listing();
        listing.setId(10L);
        listing.setTitle("T");
        listing.setPrice(BigDecimal.valueOf(12.5));

        ListingImage img1 = new ListingImage();
        img1.setImageUrl("img1");
        listing.setImages(List.of(img1));

        Conversation conv = new Conversation();
        conv.setListing(listing);

        Review r = new Review();
        r.setId(1L);
        r.setRating((byte) 5);
        r.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        r.setConversation(conv);

        when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(5L)).thenReturn(List.of(r));

        ReviewResponse out = service.getUserReviews(5L).get(0);
        assertEquals(10L, out.getListingId());
        assertEquals("T", out.getListingTitle());
        assertEquals(BigDecimal.valueOf(12.5), out.getListingPrice());
        assertEquals("img1", out.getListingImage());
    }

    @Test
    @DisplayName("getUserReviews: không có review → danh sách rỗng")
    void getUserReviews_empty_returnsEmpty() {
        when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(7L)).thenReturn(Collections.emptyList());
        assertTrue(service.getUserReviews(7L).isEmpty());
    }

    @Test
    @DisplayName("getUserReviews: conversation không gắn listing → không map listingId/title/price/image")
    void getUserReviews_conversationWithoutListing_nullListingFields() {
        Conversation conv = new Conversation();
        conv.setListing(null);
        Review r = new Review();
        r.setId(3L);
        r.setRating((byte) 5);
        r.setCreatedAt(Instant.parse("2026-01-03T00:00:00Z"));
        r.setConversation(conv);

        when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(5L)).thenReturn(List.of(r));

        ReviewResponse out = service.getUserReviews(5L).get(0);
        assertNull(out.getListingId());
        assertNull(out.getListingTitle());
        assertNull(out.getListingPrice());
        assertNull(out.getListingImage());
    }

    @Test
    @DisplayName("getUserReviews: listing không có ảnh → listingImage null")
    void getUserReviews_listingWithEmptyImages_noImageUrl() {
        Listing listing = new Listing();
        listing.setId(20L);
        listing.setTitle("NoImg");
        listing.setPrice(BigDecimal.ONE);
        listing.setImages(Collections.emptyList());

        Conversation conv = new Conversation();
        conv.setListing(listing);

        Review r = new Review();
        r.setId(4L);
        r.setRating((byte) 3);
        r.setCreatedAt(Instant.now());
        r.setConversation(conv);

        when(reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(2L)).thenReturn(List.of(r));

        ReviewResponse out = service.getUserReviews(2L).get(0);
        assertEquals(20L, out.getListingId());
        assertNull(out.getListingImage());
    }
}

