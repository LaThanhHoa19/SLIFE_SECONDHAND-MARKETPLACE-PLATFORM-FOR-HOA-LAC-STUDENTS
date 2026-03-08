package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversation_IdOrderBySentAtDesc(Long conversationId, Pageable pageable);

    void deleteByConversation_Id(Long conversationId);
}
