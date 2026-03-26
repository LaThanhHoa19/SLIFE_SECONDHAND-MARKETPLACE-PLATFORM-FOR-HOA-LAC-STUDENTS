package com.slife.marketplace.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ListingLikeService {

    private final ListingLikeRepository listingLikeRepository;
    private final ListingRepository listingRepository;

    /**
     * Một endpoint: bấm lần 1 = like, lần 2 = unlike.
     */
    @Transactional
    public ToggleLikeResponse toggle(User user, Long listingId) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
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
}
