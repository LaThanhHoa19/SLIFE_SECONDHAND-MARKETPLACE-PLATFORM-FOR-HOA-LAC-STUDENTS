package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findByConversation_IdOrderByCreatedAtDesc(Long conversationId);

    Optional<Offer> findByIdAndConversation_Id(Long offerId, Long conversationId);

    /** BR-35: Count how many offers a buyer has submitted for a listing (across all conversations). */
    @Query("SELECT COUNT(o) FROM Offer o WHERE o.buyer.id = :buyerId AND o.listing.id = :listingId")
    long countByBuyerIdAndListingId(@Param("buyerId") Long buyerId, @Param("listingId") Long listingId);
}
