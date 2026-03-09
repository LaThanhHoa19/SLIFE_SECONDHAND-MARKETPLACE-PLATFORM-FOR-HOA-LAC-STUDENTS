package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversation_IdOrderBySentAtDesc(Long conversationId, Pageable pageable);

    void deleteByConversation_Id(Long conversationId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :convId AND m.isRead = false AND m.sender.id <> :readerId")
    int markAllReadInConversation(@Param("convId") Long convId, @Param("readerId") Long readerId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :convId AND m.sender.id = :senderId AND m.messageType = com.slife.marketplace.entity.MessageType.OFFER_PROPOSAL")
    long countOfferProposalsBySenderInConversation(@Param("convId") Long convId, @Param("senderId") Long senderId);
}
