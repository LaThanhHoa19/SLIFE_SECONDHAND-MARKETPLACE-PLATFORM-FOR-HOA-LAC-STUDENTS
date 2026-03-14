package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.SavedListing;
import com.slife.marketplace.entity.SavedListingId;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SavedListingService {

    private static final String ACTIVE = "ACTIVE";

    private final SavedListingRepository savedListingRepository;
    private final ListingRepository listingRepository;
    private final ListingService listingService;

    public SavedListingService(SavedListingRepository savedListingRepository,
                               ListingRepository listingRepository,
                               ListingService listingService) {
        this.savedListingRepository = savedListingRepository;
        this.listingRepository = listingRepository;
        this.listingService = listingService;
    }

    @Transactional
    public void save(User user, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        if (!ACTIVE.equals(listing.getStatus())) {
            throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        }
        if (savedListingRepository.existsByUser_IdAndListing_Id(user.getId(), listingId)) {
            throw new SlifeException(ErrorCode.SAVED_LISTING_ALREADY);
        }
        SavedListingId id = new SavedListingId();
        id.setUserId(user.getId());
        id.setListingId(listingId);
        SavedListing saved = new SavedListing();
        saved.setId(id);
        saved.setUser(user);
        saved.setListing(listing);
        savedListingRepository.save(saved);
    }

    @Transactional
    public void unsave(User user, Long listingId) {
        if (!savedListingRepository.existsByUser_IdAndListing_Id(user.getId(), listingId)) {
            throw new SlifeException(ErrorCode.SAVED_LISTING_NOT_SAVED);
        }
        savedListingRepository.deleteByUser_IdAndListing_Id(user.getId(), listingId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> getSavedListings(User user, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 20));
        Pageable pageable = PageRequest.of(Math.max(0, page), safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SavedListing> savedPage = savedListingRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);
        List<ListingResponse> content = savedPage.getContent().stream()
                .map(sl -> listingService.buildListingResponse(sl.getListing(), user, true))
                .toList();
        return new PagedResponse<>(content, savedPage.getNumber(), savedPage.getSize(),
                savedPage.getTotalElements(), savedPage.getTotalPages());
    }

    public boolean isSaved(Long userId, Long listingId) {
        return savedListingRepository.existsByUser_IdAndListing_Id(userId, listingId);
    }
}
