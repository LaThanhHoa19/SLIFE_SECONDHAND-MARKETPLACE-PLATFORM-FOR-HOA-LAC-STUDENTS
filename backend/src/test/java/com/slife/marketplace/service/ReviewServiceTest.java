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
    @DisplayName("getUserReviews: map basic fields; reviewer/conversation null-safe")
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
    @DisplayName("getUserReviews: map listing fields + first image when exists")
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
}

