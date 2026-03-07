package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mục đích: Service ListingService
 * Endpoints liên quan: controller
 */
@Service
public class ListingService {

    private static final String DEFAULT_CONDITION = "USED_GOOD";
    private static final String DEFAULT_PURPOSE = "SALE";

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;

    public ListingService(ListingRepository listingRepository, CategoryRepository categoryRepository) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Trả về danh sách listing đơn giản để test.
     */
    public List<ListingResponse> getAllListingsForTest() {
        List<Listing> listings = listingRepository.findAll();
        return listings.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public Listing createListing(User seller, CreateListingRequest req) {
        if (seller == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        if (req == null || req.getTitle() == null || req.getTitle().isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        Listing listing = new Listing();
        listing.setSeller(seller);
        listing.setTitle(req.getTitle().trim());
        listing.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        BigDecimal price = req.getPrice() != null ? req.getPrice() : BigDecimal.ZERO;
        Boolean isGiveaway = Boolean.TRUE.equals(req.getIsGiveaway());
        if (isGiveaway) {
            price = BigDecimal.ZERO;
        }
        listing.setPrice(price);
        listing.setIsGiveaway(isGiveaway);
        listing.setItemCondition(req.getCondition() != null && !req.getCondition().isBlank()
                ? req.getCondition().trim().toUpperCase() : DEFAULT_CONDITION);
        listing.setPurpose(req.getPurpose() != null && !req.getPurpose().isBlank()
                ? req.getPurpose().trim().toUpperCase() : DEFAULT_PURPOSE);
        listing.setStatus("ACTIVE");
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(listing::setCategory);
        }
        listing.setPickupAddress(null);
        listing.setExpirationDate(null);
        listing.setCreatedAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        return listingRepository.save(listing);
    }

    public ListingResponse toResponse(Listing listing) {
        ListingResponse res = new ListingResponse();
        res.setId(listing.getId());
        res.setTitle(listing.getTitle());
        res.setImages(List.of());
        res.setSellerSummary(
                listing.getSeller() != null ? listing.getSeller().getFullName() : null
        );
        res.setIsSaved(false);
        res.setIsFollowed(false);
        return res;
    }
}
