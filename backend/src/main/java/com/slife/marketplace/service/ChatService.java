package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Message;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.util.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final UserService userService;

    /** Rate limit: last message timestamp per user id (BR-38: max 1 message per second). */
    private final Map<Long, Instant> lastMessageByUser = new ConcurrentHashMap<>();

    public ChatService(ConversationRepository conversationRepository,
                       MessageRepository messageRepository,
                       ListingRepository listingRepository,
                       UserService userService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.listingRepository = listingRepository;
        this.userService = userService;
    }

    /**
     * Get or create the single active chat session for this buyer-seller-listing.
     * Constraint: only one active ChatSession per (buyer, seller) per listing.
     */
    @Transactional
    public Conversation getOrCreateSession(Long listingId, User buyer) {
        User current = userService.getCurrentUser();
        if (!current.getId().equals(buyer.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        User seller = listing.getSeller();
        if (seller.getId().equals(buyer.getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Seller cannot open chat with self");
        }
        String sellerEmail = seller.getEmail() != null ? seller.getEmail().trim().toLowerCase() : "";
        String buyerEmail = buyer.getEmail() != null ? buyer.getEmail().trim().toLowerCase() : "";
        if (!sellerEmail.isEmpty() && sellerEmail.equals(buyerEmail)) {
            // Cùng người (seller id=2, buyer id=12): không tạo (12,2), trả về session có sẵn của listing để 2 tk cùng 1 phòng
            List<Conversation> existingForSeller = conversationRepository.findActiveByListingAndParticipantEmail(listingId, sellerEmail);
            if (!existingForSeller.isEmpty()) {
                return existingForSeller.get(0);
            }
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Seller cannot open chat with self");
        }
        Optional<Conversation> existing = conversationRepository.findActiveByListingAndParticipants(listingId, buyer.getId(), seller.getId());
        if (existing.isPresent()) {
            return existing.get();
        }
        Conversation conv = new Conversation();
        conv.setUserId1(buyer);
        conv.setUserId2(seller);
        conv.setListing(listing);
        conv.setStatus(Conversation.STATUS_ACTIVE);
        conv.setLastMessageAt(null);
        conv.setCreatedAt(Instant.now());
        conv.ensureSessionUuid();
        return conversationRepository.save(conv);
    }

    // ---

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(User user, String statusFilter) {
        Long userId = user.getId();
        String email = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : null;
        List<Conversation> byId = statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)
                ? conversationRepository.findAllByParticipantOrderByLastMessageDesc(userId)
                : conversationRepository.findAllByParticipantAndStatusOrderByLastMessageDesc(userId, statusFilter);
        List<Conversation> list = new java.util.ArrayList<>(byId);
        int byEmailCount = 0;
        if (email != null && !email.isBlank()) {
            List<Conversation> byEmail = conversationRepository.findAllByParticipantEmailOrderByLastMessageDesc(email);
            byEmailCount = byEmail.size();
            java.util.Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());
            for (Conversation c : byEmail) {
                if (!ids.contains(c.getId())) {
                    list.add(c);
                    ids.add(c.getId());
                }
            }
            list.sort((a, b) -> {
                java.time.Instant la = a.getLastMessageAt() != null ? a.getLastMessageAt() : a.getCreatedAt();
                java.time.Instant ra = b.getLastMessageAt() != null ? b.getLastMessageAt() : b.getCreatedAt();
                return ra.compareTo(la);
            });
        }
        // Tìm thêm conversation theo listing seller email (trường hợp Alice test login khác ID với Alice seed nhưng cùng email)
        // Và theo listing seller ID (người dùng là seller của listing nhưng không là participant trực tiếp do ID mismatch)
        int bySellerEmailCount = 0;
        if (email != null && !email.isBlank()) {
            List<Conversation> bySellerEmail = conversationRepository.findByListingSellerEmailOrderByLastMessageDesc(email);
            bySellerEmailCount = bySellerEmail.size();
            java.util.Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());
            for (Conversation c : bySellerEmail) {
                if (!ids.contains(c.getId())) {
                    list.add(c);
                    ids.add(c.getId());
                }
            }
        }
        // Cũng tìm conversations theo listing seller ID (user là chủ listing)
        {
            java.util.Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());
            List<Conversation> byListingSellerId = conversationRepository.findByListingSellerIdOrderByLastMessageDesc(userId);
            int byListingSellerIdCount = 0;
            for (Conversation c : byListingSellerId) {
                if (!ids.contains(c.getId())) {
                    list.add(c);
                    ids.add(c.getId());
                    byListingSellerIdCount++;
                }
            }
            if (byListingSellerIdCount > 0) {
                log.info("listSessions userId={} byListingSellerId found {} extra convs", userId, byListingSellerIdCount);
            }
        }
        log.info("listSessions userId={} email={} byId={} byEmail={} bySellerEmail={} total={}", userId, email, byId.size(), byEmailCount, bySellerEmailCount, list.size());
        // Loại bỏ hội thoại "self": (1) hai participant cùng email, hoặc (2) other trùng email current user
        String currentEmail = email;
        List<ChatSessionResponse> result = list.stream()
                .filter(c -> {
                    User u1 = c.getUserId1();
                    User u2 = c.getUserId2();
                    String e1 = u1 != null && u1.getEmail() != null ? u1.getEmail().trim().toLowerCase() : "";
                    String e2 = u2 != null && u2.getEmail() != null ? u2.getEmail().trim().toLowerCase() : "";
                    if (!e1.isEmpty() && e1.equals(e2)) {
                        log.info("listSessions: skip self-conversation (same email) convId={}", c.getId());
                        return false;
                    }
                    User other = isCurrentParticipant(u1, user) ? u2 : u1;
                    if (other == null || currentEmail == null) return true;
                    String oe = other.getEmail() != null ? other.getEmail().trim().toLowerCase() : "";
                    if (oe.isEmpty()) return true;
                    if (oe.equals(currentEmail)) {
                        log.info("listSessions: skip self-conversation (other=me) convId={}", c.getId());
                        return false;
                    }
                    return true;
                })
                .map(c -> toSessionResponse(c, user))
                .collect(Collectors.toList());
        log.info("listSessions userId={} after filter count={}", userId, result.size());
        return result;
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ChatMessageResponse> getHistory(String sessionId, int page, int size) {
        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        User current = userService.getCurrentUser();
        ensureParticipant(conv, current);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"));
        var result = messageRepository.findByConversation_IdOrderBySentAtDesc(conv.getId(), pageable)
                .map(m -> toMessageResponse(m, conv.getSessionUuid(), current));
        log.debug("getHistory sessionId={} userId={} convId={} messages={}", sessionId, current.getId(), conv.getId(), result.getNumberOfElements());
        return result;
    }

    /**
     * Send message: rate limit 1/sec (BR-38), banned/restricted check (BR-34), participant check.
     */
    @Transactional
    public ChatMessageResponse sendMessage(String sessionId, String content, User sender) {
        if (sender.getStatus() != null && ("BANNED".equals(sender.getStatus()) || "RESTRICTED".equals(sender.getStatus()))) {
            throw new SlifeException(ErrorCode.USER_BANNED_OR_RESTRICTED);
        }
        Instant now = Instant.now();
        Instant last = lastMessageByUser.get(sender.getId());
        if (last != null && now.minusSeconds(Constants.CHAT_RATE_LIMIT_SECONDS).isBefore(last)) {
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }

        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        ensureParticipant(conv, sender);

        Message msg = new Message();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setContent(content != null ? content.trim() : "");
        msg.setSentAt(now);
        msg.setIsRead(false);
        messageRepository.save(msg);

        conv.setLastMessageAt(now);
        conversationRepository.save(conv);

        lastMessageByUser.put(sender.getId(), now);
        log.debug("Chat message saved session={} sender={}", sessionId, sender.getId());
        return toMessageResponse(msg, conv.getSessionUuid(), sender);
    }

    private void ensureParticipant(Conversation c, User currentUser) {
        if (isCurrentParticipant(c.getUserId1(), currentUser) || isCurrentParticipant(c.getUserId2(), currentUser)) {
            return;
        }
        // Cho phép seller của listing truy cập conversation (theo cả ID và email)
        if (c.getListing() != null && isCurrentParticipant(c.getListing().getSeller(), currentUser)) {
            return;
        }
        throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
    }

    private boolean isCurrentParticipant(User participant, User currentUser) {
        if (participant == null || currentUser == null) return false;
        if (participant.getId().equals(currentUser.getId())) return true;
        String pe = participant.getEmail() != null ? participant.getEmail().trim().toLowerCase() : "";
        String ce = currentUser.getEmail() != null ? currentUser.getEmail().trim().toLowerCase() : "";
        return !pe.isEmpty() && pe.equals(ce);
    }

    private ChatSessionResponse toSessionResponse(Conversation c, User currentUser) {
        Long currentUserId = currentUser.getId();
        boolean currentIs1 = isCurrentParticipant(c.getUserId1(), currentUser);
        boolean currentIs2 = isCurrentParticipant(c.getUserId2(), currentUser);
        String otherName;
        if (currentIs1) {
            otherName = c.getUserId2().getFullName();
        } else if (currentIs2) {
            otherName = c.getUserId1().getFullName();
        } else {
            otherName = c.getUserId1().getId().equals(currentUserId) ? c.getUserId2().getFullName() : c.getUserId1().getFullName();
        }
        Long buyerId = c.getListing() != null && c.getListing().getSeller().getId().equals(c.getUserId1().getId()) ? c.getUserId2().getId() : c.getUserId1().getId();
        Long sellerId = c.getListing() != null ? c.getListing().getSeller().getId() : null;
        if (sellerId == null) {
            sellerId = c.getUserId2().getId();
            buyerId = c.getUserId1().getId();
        }
        Optional<Message> firstMsg = messageRepository.findByConversation_IdOrderBySentAtDesc(c.getId(), PageRequest.of(0, 1))
                .getContent().stream().findFirst();
        Message lastMsg = firstMsg.orElse(null);
        return ChatSessionResponse.builder()
                .sessionId(c.getSessionUuid())
                .listingId(c.getListing() != null ? c.getListing().getId() : null)
                .listingTitle(c.getListing() != null ? c.getListing().getTitle() : null)
                .buyerId(buyerId)
                .sellerId(sellerId)
                .otherParticipantName(otherName)
                .status(c.getStatus())
                .lastMessageAt(c.getLastMessageAt())
                .lastMessagePreview(lastMsg != null ? truncate(lastMsg.getContent(), 80) : null)
                .build();
    }

    private ChatMessageResponse toMessageResponse(Message m, String sessionUuid, User currentUser) {
        User sender = m.getSender();
        boolean fromCurrent = currentUser != null && isCurrentParticipant(sender, currentUser);
        return ChatMessageResponse.builder()
                .id(m.getId())
                .sessionId(sessionUuid)
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .content(m.getContent())
                .timestamp(m.getSentAt())
                .isRead(m.getIsRead())
                .isFromCurrentUser(fromCurrent)
                .build();
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
