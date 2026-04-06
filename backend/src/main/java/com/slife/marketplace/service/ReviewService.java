package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ReviewResponse;
import com.slife.marketplace.entity.Review;
import com.slife.marketplace.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserReviews(Long userId) {
        List<Review> reviews = reviewRepository.findByReviewee_IdOrderByCreatedAtDesc(userId);
        return reviews.stream().map(review -> {
            ReviewResponse res = new ReviewResponse();
            res.setId(review.getId());
            res.setRating(review.getRating());
            res.setComment(review.getComment());
            res.setCreatedAt(review.getCreatedAt());

            if (review.getReviewer() != null) {
                res.setReviewerId(review.getReviewer().getId());
                res.setReviewerName(review.getReviewer().getFullName());
                res.setReviewerAvatar(review.getReviewer().getAvatarUrl());
            }

            if (review.getConversation() != null && review.getConversation().getListing() != null) {
                com.slife.marketplace.entity.Listing listing = review.getConversation().getListing();
                res.setListingId(listing.getId());
                res.setListingTitle(listing.getTitle());
                res.setListingPrice(listing.getPrice());
                
                if (listing.getImages() != null && !listing.getImages().isEmpty()) {
                    res.setListingImage(listing.getImages().get(0).getImageUrl());
                }
            }

            return res;
        }).collect(Collectors.toList());
    }
}
