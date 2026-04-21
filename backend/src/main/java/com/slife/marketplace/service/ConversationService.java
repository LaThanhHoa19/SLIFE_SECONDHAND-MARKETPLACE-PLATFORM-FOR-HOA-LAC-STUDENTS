package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateConversationMessageRequest;
import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.Message;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final UserService userService;

    public ConversationService(ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               ListingRepository listingRepository,
                               UserService userService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.listingRepository = listingRepository;
        this.userService = userService;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ChatSessionResponse getOrCreateConversation(Long listingId) {
        User currentUser = userService.getCurrentUser();
        if (listingId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Listing not found"));
        User seller = listing.getSeller();
        if (seller == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Listing seller not found");
        }
        if (seller.getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "Cannot create conversation with yourself");
        }

        Conversation conversation = conversationRepository.findActiveByListingBuyerSeller(listingId, currentUser.getId(), seller.getId())
                .orElseGet(() -> createConversation(listing, currentUser, seller));
        return ChatSessionResponse.builder()
                .sessionId(conversation.getSessionUuid())
                .listingId(listing.getId())
                .listingTitle(listing.getTitle())
                .buyerId(conversation.getBuyer() != null ? conversation.getBuyer().getId() : null)
                .sellerId(conversation.getSeller() != null ? conversation.getSeller().getId() : null)
                .otherParticipantName(seller.getId().equals(currentUser.getId()) ? currentUser.getFullName() : seller.getFullName())
                .status(conversation.getStatus())
                .lastMessageAt(conversation.getLastMessageAt())
                .build();
    }

    @Transactional
    public ChatMessageResponse createMessage(Long conversationId, CreateConversationMessageRequest request) {
        User sender = userService.getCurrentUser();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));

        if (!isParticipant(conversation, sender)) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        if (sender.getStatus() != null
                && ("BANNED".equals(sender.getStatus()) || "RESTRICTED".equals(sender.getStatus()))) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        Instant now = Instant.now();
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent().trim());
        message.setSentAt(now);
        message.setIsRead(false);
        message.setUpdatedAt(now);
        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessageAt(now);
        conversationRepository.save(conversation);

        return ChatMessageResponse.builder()
                .id(savedMessage.getId())
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .content(savedMessage.getContent())
                .timestamp(now)
                .isRead(false)
                .isFromCurrentUser(true)
                .build();
    }

    private Conversation createConversation(Listing listing, User buyer, User seller) {
        Conversation conversation = new Conversation();
        conversation.setBuyer(buyer);
        conversation.setSeller(seller);
        conversation.setListing(listing);
        conversation.setStatus(Conversation.STATUS_ACTIVE);
        conversation.setLastMessageAt(Instant.now());
        Conversation saved = conversationRepository.save(conversation);

        return conversationRepository
                .findActiveByListingBuyerSeller(listing.getId(), buyer.getId(), seller.getId())
                .orElse(saved);
    }

    private boolean isParticipant(Conversation conversation, User user) {
        if (conversation == null || user == null) return false;
        Long userId = user.getId();
        return (conversation.getUserId1() != null && conversation.getUserId1().getId().equals(userId))
                || (conversation.getUserId2() != null && conversation.getUserId2().getId().equals(userId));
    }
}
