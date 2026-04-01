package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Offer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    Page<Offer> findByListing_IdOrderByCreatedAtDesc(Long listingId, Pageable pageable);

    Page<Offer> findByListing_IdAndBuyer_IdOrderByCreatedAtDesc(Long listingId, Long buyerId, Pageable pageable);

    List<Offer> findByListing_IdAndStatusOrderByCreatedAtDesc(Long listingId, String status);

    /** At most one PENDING offer per buyer per listing until seller accepts/rejects (UC-30). */
    long countByBuyer_IdAndListing_IdAndStatus(Long buyerId, Long listingId, String status);
}
