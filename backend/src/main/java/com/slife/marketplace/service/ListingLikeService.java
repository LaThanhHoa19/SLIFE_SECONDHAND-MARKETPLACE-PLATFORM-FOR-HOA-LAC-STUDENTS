package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.dto.response.ToggleLikeResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingLike;
import com.slife.marketplace.entity.ListingLikeId;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingLikeRepository;
import com.slife.marketplace.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingLikeService {

    private final ListingLikeRepository listingLikeRepository;
    private final ListingRepository listingRepository;
    private final ListingService listingService;
    private final NotificationService notificationService;

    /**
     * Một endpoint: bấm lần 1 = like, lần 2 = unlike.
     */
    @Transactional
    public ToggleLikeResponse toggle(User user, Long listingId) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        if (user.getStatus() != null
                && ("BANNED".equalsIgnoreCase(user.getStatus()) || "RESTRICTED".equalsIgnoreCase(user.getStatus()))) {
            throw new SlifeException(ErrorCode.USER_BANNED_OR_RESTRICTED);
        }
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (listingLikeRepository.existsByUser_IdAndListing_Id(user.getId(), listingId)) {
            listingLikeRepository.deleteByUser_IdAndListing_Id(user.getId(), listingId);
            long count = listingLikeRepository.countByListing_Id(listingId);
            return new ToggleLikeResponse(false, count);
        }

        ListingLikeId id = new ListingLikeId();
        id.setUserId(user.getId());
        id.setListingId(listingId);

        ListingLike row = new ListingLike();
        row.setId(id);
        row.setUser(user);
        row.setListing(listing);
        listingLikeRepository.save(row);

        if (listing.getSeller() != null && listing.getSeller().getId() != null
                && !listing.getSeller().getId().equals(user.getId())) {
            notificationService.notifyListingLiked(listing.getSeller(), user, listingId);
        }

        long count = listingLikeRepository.countByListing_Id(listingId);
        return new ToggleLikeResponse(true, count);
    }

    @Transactional(readOnly = true)
    public long countByListingId(Long listingId) {
        return listingLikeRepository.countByListing_Id(listingId);
    }

    @Transactional(readOnly = true)
    public boolean isLikedBy(Long userId, Long listingId) {
        return listingLikeRepository.existsByUser_IdAndListing_Id(userId, listingId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> getLikedListings(User user, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 20));
        Pageable pageable = PageRequest.of(Math.max(0, page), safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ListingLike> likedPage = listingLikeRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);

        List<ListingResponse> content = likedPage.getContent().stream()
                .map(ll -> listingService.buildListingResponse(ll.getListing(), user, false))
                .toList();

        return new PagedResponse<>(content, likedPage.getNumber(), likedPage.getSize(),
                likedPage.getTotalElements(), likedPage.getTotalPages());
    }
}
