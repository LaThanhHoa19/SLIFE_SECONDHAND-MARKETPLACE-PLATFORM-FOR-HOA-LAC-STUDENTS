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

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final OfferRepository offerRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Path uploadBasePath;

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

    // ── Session ───────────────────────────────────────────────────────────────

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
        String sellerEmail = lower(seller.getEmail());
        String buyerEmail  = lower(buyer.getEmail());
        if (!sellerEmail.isEmpty() && sellerEmail.equals(buyerEmail)) {
            List<Conversation> ex = conversationRepository.findActiveByListingAndParticipantEmail(listingId, sellerEmail);
            if (!ex.isEmpty()) return ex.get(0);
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Seller cannot open chat with self");
        }
        Optional<Conversation> existing = conversationRepository
                .findActiveByListingAndParticipants(listingId, buyer.getId(), seller.getId());
        if (existing.isPresent()) return existing.get();

        Conversation conv = new Conversation();
        conv.setUserId1(buyer);
        conv.setUserId2(seller);
        conv.setListing(listing);
        conv.setStatus(Conversation.STATUS_ACTIVE);
        conv.setCreatedAt(Instant.now());
        conv.ensureSessionUuid();
        return conversationRepository.save(conv);
    }

    // ── Session list ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(User user, String statusFilter) {
        Long userId = user.getId();
        String email = lower(user.getEmail());

        List<Conversation> byId = (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter))
                ? conversationRepository.findAllByParticipantOrderByLastMessageDesc(userId)
                : conversationRepository.findAllByParticipantAndStatusOrderByLastMessageDesc(userId, statusFilter);

        List<Conversation> list = new ArrayList<>(byId);
        Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());

        if (!email.isEmpty()) {
            merge(list, ids, conversationRepository.findAllByParticipantEmailOrderByLastMessageDesc(email));
            merge(list, ids, conversationRepository.findByListingSellerEmailOrderByLastMessageDesc(email));
        }
        merge(list, ids, conversationRepository.findByListingSellerIdOrderByLastMessageDesc(userId));

        list.sort((a, b) -> {
            Instant la = a.getLastMessageAt() != null ? a.getLastMessageAt() : a.getCreatedAt();
            Instant lb = b.getLastMessageAt() != null ? b.getLastMessageAt() : b.getCreatedAt();
            return lb.compareTo(la);
        });

        return list.stream()
                .filter(c -> {
                    String e1 = lower(c.getUserId1() != null ? c.getUserId1().getEmail() : null);
                    String e2 = lower(c.getUserId2() != null ? c.getUserId2().getEmail() : null);
                    if (!e1.isEmpty() && e1.equals(e2)) return false;
                    User other = isMe(c.getUserId1(), user) ? c.getUserId2() : c.getUserId1();
                    if (other == null || email.isEmpty()) return true;
                    return !lower(other.getEmail()).equals(email);
                })
                .map(c -> toSessionResponse(c, user))
                .collect(Collectors.toList());
    }

    // ── History ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getHistory(String sessionId, int page, int size) {
        Conversation conv = findConv(sessionId);
        User current = userService.getCurrentUser();
        ensureParticipant(conv, current);
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"));
        return messageRepository.findByConversation_IdOrderBySentAtDesc(conv.getId(), p)
                .map(m -> toMsgResponse(m, conv.getSessionUuid(), current, null));
    }

    // ── Send text / image ─────────────────────────────────────────────────────

    @Transactional
    public ChatMessageResponse sendMessage(String sessionId, String content,
                                           MessageType messageType, String fileUrl, User sender) {
        checkActive(sender);
        enforceRateLimit(sender);

        Conversation conv = findConv(sessionId);
        ensureParticipant(conv, sender);

        if (messageType == null) messageType = MessageType.TEXT;

        String resolved = resolveContent(content, messageType, fileUrl);
        Message msg = newMsg(conv, sender, resolved, messageType, fileUrl);
        messageRepository.save(msg);

        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);
        lastMessageByUser.put(sender.getId(), msg.getSentAt());

        ChatMessageResponse response = toMsgResponse(msg, sessionId, sender, null);
        broadcast(sessionId, response);

        User other = otherParticipant(conv, sender);
        if (other != null) {
            notificationService.notifyNewMessage(other, response, sessionId);
        }
        return response;
    }

    // ── Upload chat image ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String uploadChatImage(String sessionId, MultipartFile file) {
        Conversation conv = findConv(sessionId);
        User current = userService.getCurrentUser();
        ensureParticipant(conv, current);

        if (file.getSize() > Constants.MAX_CHAT_IMAGE_BYTES) {
            throw new SlifeException(ErrorCode.FILE_TOO_LARGE);
        }
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (!ALLOWED_IMAGE_TYPES.contains(ct)) {
            throw new SlifeException(ErrorCode.INVALID_FILE_TYPE);
        }
        String ext = ct.contains("png") ? ".png" : ct.contains("webp") ? ".webp" : ".jpg";
        String fileName = UUID.randomUUID() + ext;
        Path dir = uploadBasePath.resolve(Constants.CHAT_UPLOAD_DIR).resolve(sessionId);
        try {
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Chat image upload failed session={}", sessionId, e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        return "/uploads/" + Constants.CHAT_UPLOAD_DIR + "/" + sessionId + "/" + fileName;
    }

    // ── Offer (UC-30 / BR-35) ─────────────────────────────────────────────────

    @Transactional
    public ChatMessageResponse makeOffer(String sessionId, BigDecimal amount, User buyer) {
        checkActive(buyer);

        Conversation conv = findConv(sessionId);
        ensureParticipant(conv, buyer);

        Listing listing = conv.getListing();
        if (listing == null) throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new SlifeException(ErrorCode.OFFER_PRICE_INVALID);

        long count = offerRepository.countByBuyerIdAndListingId(buyer.getId(), listing.getId());
        if (count >= Constants.MAX_OFFERS_PER_LISTING)
            throw new SlifeException(ErrorCode.OFFER_SPAM_LIMIT);

        Offer offer = new Offer();
        offer.setConversation(conv);
        offer.setListing(listing);
        offer.setBuyer(buyer);
        offer.setAmount(amount);
        offer.setStatus("PENDING");
        offer.setCreatedAt(Instant.now());
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        String content = "💰 Trả giá: " + amount.toPlainString() + "đ";
        Message msg = newMsg(conv, buyer, content, MessageType.OFFER_PROPOSAL, null);
        messageRepository.save(msg);
        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);

        ChatMessageResponse response = toMsgResponse(msg, sessionId, buyer, offer);
        broadcast(sessionId, response);

        User seller = otherParticipant(conv, buyer);
        if (seller != null) {
            notificationService.notifyOfferProposal(seller, buyer, listing.getId(), amount);
            notificationService.notifyNewMessage(seller, response, sessionId);
        }
        return response;
    }

    // ── Accept / reject offer ─────────────────────────────────────────────────

    @Transactional
    public ChatMessageResponse respondToOffer(Long offerId, String action, User seller) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
        if (!"PENDING".equals(offer.getStatus()))
            throw new SlifeException(ErrorCode.OFFER_NOT_PENDING);

        Conversation conv = offer.getConversation();
        if (conv == null) throw new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND);
        ensureParticipant(conv, seller);
        if (offer.getBuyer().getId().equals(seller.getId()))
            throw new SlifeException(ErrorCode.FORBIDDEN);

        boolean accepted = "ACCEPTED".equalsIgnoreCase(action);
        offer.setStatus(accepted ? "ACCEPTED" : "REJECTED");
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        String sessionId = conv.getSessionUuid();
        ChatMessageResponse response;

        if (accepted) {
            Listing listing = offer.getListing();
            if (listing != null) {
                listing.setStatus("SOLD");
                listing.setUpdatedAt(Instant.now());
                listingRepository.save(listing);
            }
            Message sysMsg = newMsg(conv, seller, Constants.DEAL_CONFIRMED_MSG,
                    MessageType.DEAL_CONFIRMATION, null);
            messageRepository.save(sysMsg);
            conv.setLastMessageAt(sysMsg.getSentAt());
            conversationRepository.save(conv);
            response = toMsgResponse(sysMsg, sessionId, seller, offer);

            if (listing != null) {
                notificationService.notifyDealConfirmed(
                        offer.getBuyer(), seller, listing.getId(), listing.getTitle());
            }
        } else {
            Message rejMsg = newMsg(conv, seller, "❌ Offer bị từ chối.", MessageType.TEXT, null);
            messageRepository.save(rejMsg);
            conv.setLastMessageAt(rejMsg.getSentAt());
            conversationRepository.save(conv);
            response = toMsgResponse(rejMsg, sessionId, seller, null);
        }

        broadcast(sessionId, response);
        return response;
    }

    // ── Mark as read (UC-26) ──────────────────────────────────────────────────

    @Transactional
    public void markSessionAsRead(String sessionId, User reader) {
        Conversation conv = findConv(sessionId);
        ensureParticipant(conv, reader);
        int updated = messageRepository.markAllReadInConversation(conv.getId(), reader.getId());
        if (updated > 0) {
            broadcast(sessionId, Map.of("event", "READ", "readerId", reader.getId()));
        }
    }

    // ── Typing indicator ──────────────────────────────────────────────────────

    public void broadcastTyping(String sessionId, String senderEmail, boolean isTyping) {
        broadcast(sessionId, Map.of(
                "event", "TYPING",
                "sessionId", sessionId,
                "senderEmail", senderEmail,
                "isTyping", isTyping));
    }

    // ── Quick replies ─────────────────────────────────────────────────────────

    public List<String> getQuickReplies() {
        return com.slife.marketplace.util.QuickReplyUtil.getQuickReplies();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Conversation findConv(String sessionId) {
        return conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
    }

    private void checkActive(User user) {
        String s = user.getStatus();
        if ("BANNED".equals(s) || "RESTRICTED".equals(s))
            throw new SlifeException(ErrorCode.USER_BANNED_OR_RESTRICTED);
    }

    private void enforceRateLimit(User sender) {
        Instant now  = Instant.now();
        Instant last = lastMessageByUser.get(sender.getId());
        if (last != null && now.minusSeconds(Constants.CHAT_RATE_LIMIT_SECONDS).isBefore(last))
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED);
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

    private Message newMsg(Conversation conv, User sender, String content,
                            MessageType type, String fileUrl) {
        Message m = new Message();
        m.setConversation(conv);
        m.setSender(sender);
        m.setContent(content);
        m.setMessageType(type);
        m.setFileUrl(fileUrl);
        m.setSentAt(Instant.now());
        m.setIsRead(false);
        return m;
    }

    private void ensureParticipant(Conversation c, User user) {
        if (isMe(c.getUserId1(), user) || isMe(c.getUserId2(), user)) return;
        if (c.getListing() != null && isMe(c.getListing().getSeller(), user)) return;
        throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
    }

    private boolean isMe(User p, User current) {
        if (p == null || current == null) return false;
        if (p.getId().equals(current.getId())) return true;
        String pe = lower(p.getEmail()), ce = lower(current.getEmail());
        return !pe.isEmpty() && pe.equals(ce);
    }

    private User otherParticipant(Conversation conv, User me) {
        if (isMe(conv.getUserId1(), me)) return conv.getUserId2();
        if (isMe(conv.getUserId2(), me)) return conv.getUserId1();
        return null;
    }

    private void broadcast(String sessionId, Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/chat." + sessionId, payload);
        } catch (Exception ex) {
            log.warn("broadcast failed session={}: {}", sessionId, ex.getMessage());
        }
    }

    private static String lower(String s) {
        return s != null ? s.trim().toLowerCase() : "";
    }

    private static void merge(List<Conversation> list, Set<Long> ids, List<Conversation> source) {
        for (Conversation c : source) {
            if (ids.add(c.getId())) list.add(c);
        }
    }

    private ChatSessionResponse toSessionResponse(Conversation c, User me) {
        boolean meIs1 = isMe(c.getUserId1(), me);
        String otherName = meIs1 ? c.getUserId2().getFullName() : c.getUserId1().getFullName();

        Long sellerId = c.getListing() != null ? c.getListing().getSeller().getId() : c.getUserId2().getId();
        Long buyerId  = sellerId.equals(c.getUserId1().getId()) ? c.getUserId2().getId() : c.getUserId1().getId();

        Message lastMsg = messageRepository
                .findByConversation_IdOrderBySentAtDesc(c.getId(), PageRequest.of(0, 1))
                .getContent().stream().findFirst().orElse(null);

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

    private ChatMessageResponse toMsgResponse(Message m, String sessionUuid,
                                               User current, Offer offer) {
        boolean fromMe = current != null && isMe(m.getSender(), current);
        return ChatMessageResponse.builder()
                .id(m.getId())
                .sessionId(sessionUuid)
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .content(m.getContent())
                .timestamp(m.getSentAt())
                .isRead(m.getIsRead())
                .isFromCurrentUser(fromMe)
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
