package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findBySessionUuid(String sessionUuid);

    /** One active session per (buyer, seller, listing) — user1/user2 order may vary */
    List<Conversation> findByListing_IdAndStatus(Long listingId, String status);

    @Query("SELECT c FROM Conversation c WHERE (c.userId1.id = :userId OR c.userId2.id = :userId) ORDER BY c.lastMessageAt DESC, c.createdAt DESC")
    List<Conversation> findAllByParticipantOrderByLastMessageDesc(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE (c.userId1.id = :userId OR c.userId2.id = :userId) AND c.status = :status ORDER BY c.lastMessageAt DESC, c.createdAt DESC")
    List<Conversation> findAllByParticipantAndStatusOrderByLastMessageDesc(@Param("userId") Long userId, @Param("status") String status);

    /** Cùng email (tránh trường hợp 2 user record cùng email: seed vs test login). */
    @Query("SELECT c FROM Conversation c WHERE (LOWER(c.userId1.email) = LOWER(:email) OR LOWER(c.userId2.email) = LOWER(:email)) ORDER BY c.lastMessageAt DESC, c.createdAt DESC")
    List<Conversation> findAllByParticipantEmailOrderByLastMessageDesc(@Param("email") String email);

    @Query("SELECT c FROM Conversation c WHERE c.listing.id = :listingId AND c.status = 'ACTIVE' AND ((c.userId1.id = :a AND c.userId2.id = :b) OR (c.userId1.id = :b AND c.userId2.id = :a))")
    Optional<Conversation> findActiveByListingAndParticipants(@Param("listingId") Long listingId, @Param("a") Long userIdA, @Param("b") Long userIdB);

    /** Tìm hội thoại ACTIVE của listing có participant trùng email (để seller cùng email join đúng 1 room với buyer). */
    @Query("SELECT c FROM Conversation c WHERE c.listing.id = :listingId AND c.status = 'ACTIVE' AND (LOWER(c.userId1.email) = LOWER(:participantEmail) OR LOWER(c.userId2.email) = LOWER(:participantEmail)) ORDER BY c.lastMessageAt DESC, c.createdAt DESC")
    List<Conversation> findActiveByListingAndParticipantEmail(@Param("listingId") Long listingId, @Param("participantEmail") String participantEmail);

    /** Tìm hội thoại có listing owned by seller với email (phục vụ Alice test login khác ID nhưng cùng email với seller). */
    @Query("SELECT c FROM Conversation c WHERE c.listing IS NOT NULL AND LOWER(c.listing.seller.email) = LOWER(:sellerEmail) ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findByListingSellerEmailOrderByLastMessageDesc(@Param("sellerEmail") String sellerEmail);

    /** Tìm hội thoại theo seller ID của listing — để seller thấy các cuộc hội thoại liên quan đến listing của mình. */
    @Query("SELECT c FROM Conversation c WHERE c.listing IS NOT NULL AND c.listing.seller.id = :sellerId ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findByListingSellerIdOrderByLastMessageDesc(@Param("sellerId") Long sellerId);

    /** Tìm conversation ACTIVE giữa buyer và seller theo listing. */
    @Query("SELECT c FROM Conversation c WHERE c.listing.id = :listingId AND c.status = 'ACTIVE' AND c.userId1.id = :buyerId AND c.userId2.id = :sellerId")
    Optional<Conversation> findActiveByListingBuyerSeller(@Param("listingId") Long listingId, @Param("buyerId") Long buyerId, @Param("sellerId") Long sellerId);
}
