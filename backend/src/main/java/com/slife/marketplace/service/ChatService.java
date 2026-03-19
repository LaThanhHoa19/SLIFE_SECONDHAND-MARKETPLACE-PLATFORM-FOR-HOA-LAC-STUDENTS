package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.entity.*;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.*;
import com.slife.marketplace.util.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"};
    private static final Set<String> ALLOWED_IMAGE_TYPE_SET = Set.of(ALLOWED_IMAGE_TYPES);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final OfferRepository offerRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Path uploadBasePath;

    /** Rate limit: last message timestamp per user id (BR-38: max 1 message per second). */
    private final Map<Long, Instant> lastMessageByUser = new ConcurrentHashMap<>();

    public ChatService(ConversationRepository conversationRepository,
                       MessageRepository messageRepository,
                       ListingRepository listingRepository,
                       OfferRepository offerRepository,
                       UserService userService,
                       NotificationService notificationService,
                       SimpMessagingTemplate messagingTemplate,
                       Path uploadBasePath) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.listingRepository = listingRepository;
        this.offerRepository = offerRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
        this.uploadBasePath = uploadBasePath;
    }

    // ── Session management ────────────────────────────────────────────────────

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

    // ── Session list ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(User user, String statusFilter) {
        Long userId = user.getId();
        String email = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : null;
        List<Conversation> byId = statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)
                ? conversationRepository.findAllByParticipantOrderByLastMessageDesc(userId)
                : conversationRepository.findAllByParticipantAndStatusOrderByLastMessageDesc(userId, statusFilter);
        List<Conversation> list = new ArrayList<>(byId);
        int byEmailCount = 0;
        if (email != null && !email.isBlank()) {
            List<Conversation> byEmail = conversationRepository.findAllByParticipantEmailOrderByLastMessageDesc(email);
            byEmailCount = byEmail.size();
            Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());
            for (Conversation c : byEmail) {
                if (!ids.contains(c.getId())) {
                    list.add(c);
                    ids.add(c.getId());
                }
            }
            list.sort((a, b) -> {
                Instant la = a.getLastMessageAt() != null ? a.getLastMessageAt() : a.getCreatedAt();
                Instant ra = b.getLastMessageAt() != null ? b.getLastMessageAt() : b.getCreatedAt();
                return ra.compareTo(la);
            });
        }
        int bySellerEmailCount = 0;
        if (email != null && !email.isBlank()) {
            List<Conversation> bySellerEmail = conversationRepository.findByListingSellerEmailOrderByLastMessageDesc(email);
            bySellerEmailCount = bySellerEmail.size();
            Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());
            for (Conversation c : bySellerEmail) {
                if (!ids.contains(c.getId())) list.add(c);
            }
        }
        {
            Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());
            List<Conversation> byListingSellerId = conversationRepository.findByListingSellerIdOrderByLastMessageDesc(userId);
            int extra = 0;
            for (Conversation c : byListingSellerId) {
                if (!ids.contains(c.getId())) {
                    list.add(c);
                    ids.add(c.getId());
                    extra++;
                }
            }
            if (extra > 0) log.info("listSessions userId={} byListingSellerId extra={}", userId, extra);
        }
        log.info("listSessions userId={} email={} byId={} byEmail={} bySellerEmail={} total={}",
                userId, email, byId.size(), byEmailCount, bySellerEmailCount, list.size());
        String currentEmail = email;
        List<ChatSessionResponse> result = list.stream()
                .filter(c -> {
                    User u1 = c.getUserId1();
                    User u2 = c.getUserId2();
                    String e1 = u1 != null && u1.getEmail() != null ? u1.getEmail().trim().toLowerCase() : "";
                    String e2 = u2 != null && u2.getEmail() != null ? u2.getEmail().trim().toLowerCase() : "";
                    if (!e1.isEmpty() && e1.equals(e2)) return false;
                    User other = isCurrentParticipant(u1, user) ? u2 : u1;
                    if (other == null || currentEmail == null) return true;
                    String oe = other.getEmail() != null ? other.getEmail().trim().toLowerCase() : "";
                    return oe.isEmpty() || !oe.equals(currentEmail);
                })
                .map(c -> toSessionResponse(c, user))
                .collect(Collectors.toList());
        log.info("listSessions userId={} after filter count={}", userId, result.size());
        return result;
    }

    // ── Message history ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getHistory(String sessionId, int page, int size) {
        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        User current = userService.getCurrentUser();
        ensureParticipant(conv, current);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"));
        return messageRepository.findByConversation_IdOrderBySentAtDesc(conv.getId(), pageable)
                .map(m -> toMessageResponse(m, conv.getSessionUuid(), current));
    }

    // ── Send message (REST + WS shared path) ─────────────────────────────────

    /**
     * Send a TEXT or IMAGE message.
     * Rate limit: 1 msg/sec per user (BR-38).
     * Banned/restricted users are blocked (BR-34).
     * Pushes the message to the other participant via WebSocket.
     */
    @Transactional
    public ChatMessageResponse sendMessage(String sessionId, String content,
                                           MessageType messageType, String fileUrl, User sender) {
        checkNotBannedOrRestricted(sender);
        enforceRateLimit(sender);

        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        ensureParticipant(conv, sender);

        if (messageType == null) messageType = MessageType.TEXT;
        String resolvedContent = resolveContent(content, messageType, fileUrl);

        Message msg = buildMessage(conv, sender, resolvedContent, messageType, fileUrl);
        messageRepository.save(msg);

        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);
        lastMessageByUser.put(sender.getId(), msg.getSentAt());

        ChatMessageResponse response = toMessageResponse(msg, conv.getSessionUuid(), sender);

        // Push real-time to the other participant
        User other = getOtherParticipant(conv, sender);
        if (other != null) {
            notificationService.notifyNewMessage(other, response, sessionId);
        }
        // Also broadcast to the session topic so the sender's other tabs update
        broadcastToSession(sessionId, response);

        log.debug("sendMessage session={} sender={} type={}", sessionId, sender.getId(), messageType);
        return response;
    }

    // ── Image upload ──────────────────────────────────────────────────────────

    /**
     * Upload a chat image. Validates size and type.
     * Stores to uploads/chats/{sessionId}/{uuid}.ext
     * Returns the public URL path.
     */
    @Transactional(readOnly = true)
    public String uploadChatImage(String sessionId, MultipartFile file) {
        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        User current = userService.getCurrentUser();
        ensureParticipant(conv, current);

        if (file.getSize() > Constants.MAX_CHAT_IMAGE_BYTES) {
            throw new SlifeException(ErrorCode.FILE_TOO_LARGE);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPE_SET.contains(contentType.toLowerCase())) {
            throw new SlifeException(ErrorCode.INVALID_FILE_TYPE);
        }

        String ext = switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String fileName = UUID.randomUUID() + ext;
        Path dir = uploadBasePath.resolve(Constants.CHAT_UPLOAD_DIR).resolve(sessionId);
        try {
            Files.createDirectories(dir);
            Path dest = dir.resolve(fileName);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Chat image upload failed session={}", sessionId, e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        return "/uploads/" + Constants.CHAT_UPLOAD_DIR + "/" + sessionId + "/" + fileName;
    }

    // ── Offer negotiation (UC-30) ─────────────────────────────────────────────

    /**
     * Make an offer: saves Offer entity + OFFER_PROPOSAL message.
     * BR-35: max 5 offers per buyer per listing.
     */
    @Transactional
    public ChatMessageResponse makeOffer(String sessionId, BigDecimal amount, User buyer) {
        checkNotBannedOrRestricted(buyer);

        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        ensureParticipant(conv, buyer);

        Listing listing = conv.getListing();
        if (listing == null) throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SlifeException(ErrorCode.OFFER_PRICE_INVALID);
        }

        // BR-35: check spam limit
        long offerCount = offerRepository.countByBuyerIdAndListingId(buyer.getId(), listing.getId());
        if (offerCount >= Constants.MAX_OFFERS_PER_LISTING) {
            throw new SlifeException(ErrorCode.OFFER_SPAM_LIMIT);
        }

        // Persist offer
        Offer offer = new Offer();
        offer.setConversation(conv);
        offer.setListing(listing);
        offer.setBuyer(buyer);
        offer.setAmount(amount);
        offer.setStatus(OfferService.STATUS_PENDING);
        offer.setCreatedAt(Instant.now());
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        // Create OFFER_PROPOSAL message
        String content = "💰 Trả giá: " + amount.toPlainString() + "đ";
        Message msg = buildMessage(conv, buyer, content, MessageType.OFFER_PROPOSAL, null);
        messageRepository.save(msg);

        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);

        ChatMessageResponse response = toMessageResponse(msg, conv.getSessionUuid(), buyer, offer);

        User seller = getOtherParticipant(conv, buyer);
        if (seller != null) {
            notificationService.notifyOfferProposal(seller, buyer, listing.getId(), amount);
            notificationService.notifyNewMessage(seller, response, sessionId);
        }
        broadcastToSession(sessionId, response);

        log.info("makeOffer session={} buyerId={} amount={} offerId={}", sessionId, buyer.getId(), amount, offer.getId());
        return response;
    }

    // ── Respond to offer (UC-30 accept/reject) ────────────────────────────────

    /**
     * Seller accepts or rejects an offer.
     * If ACCEPTED: updates listing to SOLD + sends DEAL_CONFIRMATION system message + notifies both parties.
     */
    @Transactional
    public ChatMessageResponse respondToOffer(Long offerId, String action, User seller) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
        if (!OfferService.STATUS_PENDING.equals(offer.getStatus())) {
            throw new SlifeException(ErrorCode.OFFER_NOT_PENDING);
        }
        Conversation conv = offer.getConversation();
        if (conv == null) throw new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND);
        ensureParticipant(conv, seller);
        // Seller must not be the buyer
        if (offer.getBuyer().getId().equals(seller.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        boolean accepted = "ACCEPTED".equalsIgnoreCase(action);
        offer.setStatus(accepted ? OfferService.STATUS_ACCEPTED : OfferService.STATUS_REJECTED);
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        String sessionId = conv.getSessionUuid();
        ChatMessageResponse response;

        if (accepted) {
            Listing listing = offer.getListing();
            // Update listing to SOLD (UC-28)
            if (listing != null) {
                listing.setStatus("SOLD");
                listing.setUpdatedAt(Instant.now());
                listingRepository.save(listing);
            }
            // System DEAL_CONFIRMATION message
            Message sysMsg = buildMessage(conv, seller, Constants.DEAL_CONFIRMED_MSG,
                    MessageType.DEAL_CONFIRMATION, null);
            messageRepository.save(sysMsg);
            conv.setLastMessageAt(sysMsg.getSentAt());
            conversationRepository.save(conv);
            response = toMessageResponse(sysMsg, sessionId, seller, offer);

            // Notify both parties
            User buyer = offer.getBuyer();
            if (listing != null) {
                notificationService.notifyDealConfirmed(buyer, seller,
                        listing.getId(), listing.getTitle());
            }
            log.info("respondToOffer ACCEPTED offerId={} listingId={}", offerId,
                    listing != null ? listing.getId() : null);
        } else {
            // Rejected: just a short TEXT message
            Message rejMsg = buildMessage(conv, seller, "❌ Offer bị từ chối.", MessageType.TEXT, null);
            messageRepository.save(rejMsg);
            conv.setLastMessageAt(rejMsg.getSentAt());
            conversationRepository.save(conv);
            response = toMessageResponse(rejMsg, sessionId, seller);
            log.info("respondToOffer REJECTED offerId={}", offerId);
        }

        broadcastToSession(sessionId, response);
        return response;
    }

    // ── Read receipts (UC-26) ─────────────────────────────────────────────────

    @Transactional
    public void markSessionAsRead(String sessionId, User reader) {
        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        ensureParticipant(conv, reader);
        int updated = messageRepository.markAllReadInConversation(conv.getId(), reader.getId());
        if (updated > 0) {
            log.debug("markSessionAsRead session={} reader={} updated={}", sessionId, reader.getId(), updated);
            // Notify the other participant their messages were read
            broadcastToSession(sessionId, Map.of("event", "READ", "readerId", reader.getId()));
        }
    }

    // ── Typing indicator (UC-33) ──────────────────────────────────────────────

    /**
     * Broadcast a typing event to all session subscribers.
     * Called from WebSocket handler — no DB interaction needed.
     */
    public void broadcastTyping(String sessionId, String senderEmail, boolean isTyping) {
        Map<String, Object> event = Map.of(
                "event", "TYPING",
                "sessionId", sessionId,
                "senderEmail", senderEmail,
                "isTyping", isTyping
        );
        broadcastToSession(sessionId, event);
    }

    // ── Quick replies ─────────────────────────────────────────────────────────

    public List<String> getQuickReplies() {
        return com.slife.marketplace.util.QuickReplyUtil.getQuickReplies();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void checkNotBannedOrRestricted(User user) {
        if (user.getStatus() != null &&
                ("BANNED".equals(user.getStatus()) || "RESTRICTED".equals(user.getStatus()))) {
            throw new SlifeException(ErrorCode.USER_BANNED_OR_RESTRICTED);
        }
    }

    private void enforceRateLimit(User sender) {
        Instant now = Instant.now();
        Instant last = lastMessageByUser.get(sender.getId());
        if (last != null && now.minusSeconds(Constants.CHAT_RATE_LIMIT_SECONDS).isBefore(last)) {
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }
    }

    private String resolveContent(String content, MessageType type, String fileUrl) {
        if (type == MessageType.IMAGE) {
            return (content != null && !content.isBlank()) ? content.trim() : "[Hình ảnh]";
        }
        if ((content == null || content.isBlank()) && type == MessageType.TEXT) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Message content is required");
        }
        return content != null ? content.trim() : "";
    }

    private Message buildMessage(Conversation conv, User sender, String content,
                                  MessageType type, String fileUrl) {
        Message msg = new Message();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setContent(content);
        msg.setMessageType(type);
        msg.setFileUrl(fileUrl);
        msg.setSentAt(Instant.now());
        msg.setIsRead(false);
        return msg;
    }

    private void ensureParticipant(Conversation c, User currentUser) {
        if (isCurrentParticipant(c.getUserId1(), currentUser) || isCurrentParticipant(c.getUserId2(), currentUser)) {
            return;
        }
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

    private User getOtherParticipant(Conversation conv, User current) {
        if (isCurrentParticipant(conv.getUserId1(), current)) return conv.getUserId2();
        if (isCurrentParticipant(conv.getUserId2(), current)) return conv.getUserId1();
        return null;
    }

    private void broadcastToSession(String sessionId, Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/chat." + sessionId, payload);
        } catch (Exception ex) {
            log.warn("broadcastToSession failed session={}: {}", sessionId, ex.getMessage());
        }
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
            otherName = c.getUserId1().getId().equals(currentUserId)
                    ? c.getUserId2().getFullName() : c.getUserId1().getFullName();
        }
        Long buyerId = c.getListing() != null && c.getListing().getSeller().getId().equals(c.getUserId1().getId())
                ? c.getUserId2().getId() : c.getUserId1().getId();
        Long sellerId = c.getListing() != null ? c.getListing().getSeller().getId() : null;
        if (sellerId == null) {
            sellerId = c.getUserId2().getId();
            buyerId = c.getUserId1().getId();
        }
        Optional<Message> firstMsg = messageRepository
                .findByConversation_IdOrderBySentAtDesc(c.getId(), PageRequest.of(0, 1))
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
        return toMessageResponse(m, sessionUuid, currentUser, null);
    }

    private ChatMessageResponse toMessageResponse(Message m, String sessionUuid, User currentUser, Offer offer) {
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
                .messageType(m.getMessageType())
                .fileUrl(m.getFileUrl())
                .offerId(offer != null ? offer.getId() : null)
                .offerAmount(offer != null ? offer.getAmount() : null)
                .offerStatus(offer != null ? offer.getStatus() : null)
                .build();
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
