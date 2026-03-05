/**
 * Mục đích: Service ListingService
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ListingService {
    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;

    public ListingService(ListingRepository listingRepository, ListingImageRepository listingImageRepository) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
    }
    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> getListings(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Listing> listingPage = listingRepository.findAll(pageable);

        System.out.println("Total listings in DB: " + listingPage.getTotalElements());

        List<ListingResponse> listingResponses = listingPage.getContent().stream()
                .map(this::toListingResponse)
                .toList();

        PagedResponse<ListingResponse> response = new PagedResponse<>();
        response.setData(listingResponses);
        response.setTotalElements(listingPage.getTotalElements());
        response.setTotalPages(listingPage.getTotalPages());
        response.setPage(listingPage.getNumber());
        response.setSize(listingPage.getSize());
        return response;
    }

    private ListingResponse toListingResponse(Listing listing) {
        ListingResponse response = new ListingResponse();
        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setImages(findImageUrls(listing.getId()));
        response.setSellerSummary(buildSellerSummary(listing));
        response.setIsSaved(false);
        response.setIsFollowed(false);
        return response;
    }

    private List<String> findImageUrls(Long listingId) {
        return listingImageRepository.findByListingIdOrderByDisplayOrderAsc(listingId)
                .stream()
                .map(ListingImage::getImageUrl)
                .toList();
    }

    private Map<String, Object> buildSellerSummary(Listing listing) {
        if (Objects.isNull(listing.getSeller())) {
            return null;
        }

        Map<String, Object> sellerSummary = new HashMap<>();
        sellerSummary.put("id", listing.getSeller().getId());
        sellerSummary.put("fullName", listing.getSeller().getFullName());
        sellerSummary.put("avatarUrl", listing.getSeller().getAvatarUrl());
        return sellerSummary;
    }
}
// TODO: triển khai methods theo spec, chỉ rõ validation/transaction/security. }