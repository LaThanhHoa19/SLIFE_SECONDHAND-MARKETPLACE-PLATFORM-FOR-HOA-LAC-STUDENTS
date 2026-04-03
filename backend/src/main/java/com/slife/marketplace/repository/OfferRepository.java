package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Offer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    /**
     * Khớp giá thỏa thuận với lượt trả giá gần nhất (PENDING hoặc đã ACCEPTED — ví dụ sau accept offer vẫn chốt lại trong chat).
     */
    Optional<Offer> findFirstByListing_IdAndBuyer_IdAndAmountAndStatusInOrderByCreatedAtDesc(
            Long listingId, Long buyerId, BigDecimal amount, List<String> statuses);

    Page<Offer> findByListing_IdOrderByCreatedAtDesc(Long listingId, Pageable pageable);

    Page<Offer> findByListing_IdAndBuyer_IdOrderByCreatedAtDesc(Long listingId, Long buyerId, Pageable pageable);

    List<Offer> findByListing_IdAndStatusOrderByCreatedAtDesc(Long listingId, String status);

    /** At most one PENDING offer per buyer per listing until seller accepts/rejects (UC-30). */
    long countByBuyer_IdAndListing_IdAndStatus(Long buyerId, Long listingId, String status);
}
