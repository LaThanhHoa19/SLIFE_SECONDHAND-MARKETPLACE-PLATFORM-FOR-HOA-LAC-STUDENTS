package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.repository.ListingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mục đích: Service ListingService
 * Endpoints liên quan: controller
 */
@Service
public class ListingService {

    private final ListingRepository listingRepository;

    public ListingService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    /**
     * Trả về danh sách listing đơn giản để test.
     */
    public List<ListingResponse> getAllListingsForTest() {
        List<Listing> listings = listingRepository.findAll();
        return listings.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private ListingResponse toResponse(Listing listing) {
        ListingResponse res = new ListingResponse();
        res.setId(listing.getId());
        res.setTitle(listing.getTitle());
        // Chưa có bảng images nên để rỗng để test
        res.setImages(List.of());
        res.setSellerSummary(
                listing.getSeller() != null ? listing.getSeller().getFullName() : null
        );
        res.setIsSaved(false);
        res.setIsFollowed(false);
        return res;
    }
}
