package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.SearchRequest;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.repository.ListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

@Service
public class SearchService {

    private static final Set<String> VALID_PURPOSE   = Set.of("SALE", "GIVEAWAY", "FLASH");
    private static final Set<String> VALID_CONDITION = Set.of("NEW", "USED_LIKE_NEW", "USED_GOOD", "USED_FAIR");

    private final ListingRepository listingRepository;

    public SearchService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public Page<Listing> search(SearchRequest request) {
        int pageIndex = request.getPage() != null && request.getPage() >= 0 ? request.getPage() : 0;
        Integer requestedSize = request.getSize();
        int pageSize;
        if (requestedSize == null)       pageSize = 20;
        else if (requestedSize < 10)     pageSize = 10;
        else if (requestedSize > 20)     pageSize = 20;
        else                             pageSize = requestedSize;

        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        String q        = normalize(request.getQ());
        String location = normalize(request.getLocation());
        String purpose  = toUpperOrNull(request.getPurpose(), VALID_PURPOSE);
        String itemCond = toUpperOrNull(request.getItemCondition(), VALID_CONDITION);

        BigDecimal priceMin = request.getPriceMin();
        BigDecimal priceMax = request.getPriceMax();

        return listingRepository.findByFilters(q, request.getCategoryId(), location,
                purpose, itemCond, priceMin, priceMax, pageable);
    }

    private static String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s.trim().toLowerCase();
    }

    private static String toUpperOrNull(String s, Set<String> whitelist) {
        if (s == null || s.isBlank()) return null;
        String upper = s.trim().toUpperCase();
        return whitelist.contains(upper) ? upper : null;
    }
}