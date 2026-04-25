package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.SearchRequest;
import com.slife.marketplace.entity.Category;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.springframework.lang.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Service
public class SearchService {

    private static final Set<String> VALID_PURPOSE = Set.of("SALE", "GIVEAWAY", "FLASH");
    private static final Set<String> VALID_CONDITION = Set.of("NEW", "USED", "USED_LIKE_NEW", "USED_GOOD", "USED_FAIR");
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "price", "title");

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;

    public SearchService(ListingRepository listingRepository, CategoryRepository categoryRepository) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<Listing> search(SearchRequest request) {
        int pageIndex = request.getPage() != null && request.getPage() >= 0 ? request.getPage() : 0;
        Integer requestedSize = request.getSize();
        int pageSize;
        if (requestedSize == null) pageSize = 20;
        else if (requestedSize < 10) pageSize = 10;
        else if (requestedSize > 20) pageSize = 20;
        else pageSize = requestedSize;

        Pageable pageable = PageRequest.of(pageIndex, pageSize, parseSort(request.getSort()));

        String q = normalize(request.getQ());
        String searchPrefix = toSearchPrefix(q);
        String location = normalize(request.getLocation());
        String purpose = toUpperOrNull(request.getPurpose(), VALID_PURPOSE);
        String itemCond = toUpperOrNull(request.getItemCondition(), VALID_CONDITION);

        BigDecimal priceMin = request.getPriceMin();
        BigDecimal priceMax = request.getPriceMax();

        Long effectiveCategoryId = request.getSubcategoryId() != null
                ? request.getSubcategoryId()
                : request.getCategoryId();

        Set<Long> categoryIds = effectiveCategoryId != null
                ? collectCategoryAndDescendants(effectiveCategoryId)
                : null;

        return listingRepository.findByFilters(
                q,
                searchPrefix,
                categoryIds,
                location,
                purpose,
                itemCond,
                priceMin,
                priceMax,
                Instant.now(),
                pageable
        );
    }

    private Set<Long> collectCategoryAndDescendants(Long categoryId) {
        Set<Long> ids = new HashSet<>();
        if (categoryId == null) {
            return ids;
        }
        ids.add(categoryId);
        categoryRepository.findByParent_Id(categoryId)
                .stream()
                .map(Category::getId)
                .filter(java.util.Objects::nonNull)
                .forEach(ids::add);
        return ids;
    }

    private static String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s.trim().toLowerCase();
    }

    private static String toSearchPrefix(String q) {
        if (q == null) {
            return null;
        }
        String[] parts = q.split("\\s+");
        for (String part : parts) {
            if (!part.isBlank()) {
                return part;
            }
        }
        return null;
    }

    private static String toUpperOrNull(String s, Set<String> whitelist) {
        if (s == null || s.isBlank()) return null;
        String upper = s.trim().toUpperCase();
        return whitelist.contains(upper) ? upper : null;
    }

    @NonNull
    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }

        String[] parts = sort.split(",");
        String field = parts[0].trim();
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            field = "createdAt";
        }

        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.ASC;
        }

        return Sort.by(direction, field);
    }
}