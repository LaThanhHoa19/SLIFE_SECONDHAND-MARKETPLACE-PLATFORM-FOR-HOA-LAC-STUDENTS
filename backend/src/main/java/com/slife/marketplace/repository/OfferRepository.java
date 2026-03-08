package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findByConversation_IdOrderByCreatedAtDesc(Long conversationId);

    Optional<Offer> findByIdAndConversation_Id(Long offerId, Long conversationId);
}