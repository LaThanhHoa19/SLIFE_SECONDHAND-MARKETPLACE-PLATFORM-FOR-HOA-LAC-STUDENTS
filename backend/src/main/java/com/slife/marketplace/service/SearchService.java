/**
 * Mục đích: Service SearchService
 * Endpoints liên quan: controller
 *
 * SCRUM-44:
 * - Cung cấp nghiệp vụ tìm kiếm theo keyword + bộ lọc category & location.
 * - Đảm bảo xử lý dynamic query khi tham số có thể null/blank.
 */
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

@Service
public class SearchService {

    private final ListingRepository listingRepository;

    public SearchService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    /**
     * Thực hiện tìm kiếm listing với keyword + filter category & location.
     * - Nếu q null/blank -> bỏ điều kiện keyword.
     * - Nếu categoryId null -> bỏ filter category.
     * - Nếu location null/blank -> bỏ filter location.
     */
    @Transactional(readOnly = true)
    public Page<Listing> search(SearchRequest request) {
        int pageIndex = request.getPage() != null && request.getPage() >= 0 ? request.getPage() : 0;
        int pageSize = request.getSize() != null && request.getSize() > 0 ? Math.min(request.getSize(), 50) : 10;

        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        String keyword = request.getQ();
        String normalizedQ = (keyword == null || keyword.isBlank()) ? null : keyword.trim().toLowerCase();
        String normalizedLocation = (request.getLocation() == null || request.getLocation().isBlank())
                ? null
                : request.getLocation().trim();

        return listingRepository.findByFilters(
                normalizedQ,
                request.getCategoryId(),
                normalizedLocation,
                pageable
        );
    }
}