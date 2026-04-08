package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionPageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.dto.response.MessageReferenceResponse;
import com.slife.marketplace.entity.*;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.*;
import com.slife.marketplace.util.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
import java.text.Normalizer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import java.util.Locale;
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
    private final BlockService blockService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SystemEmailService systemEmailService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Path uploadBasePath;

    /** Rate limit: last message timestamp per user id (BR-38: max 1 message per second). */
    private final Map<Long, Instant> lastMessageByUser = new ConcurrentHashMap<>();

    public ChatService(ConversationRepository conversationRepository,
                       MessageRepository messageRepository,
                       ListingRepository listingRepository,
                       OfferRepository offerRepository,
                       BlockService blockService,
                       UserService userService,
                       NotificationService notificationService,
                       SystemEmailService systemEmailService,
                       SimpMessagingTemplate messagingTemplate,
                       Path uploadBasePath) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.listingRepository = listingRepository;
        this.offerRepository = offerRepository;
        this.blockService = blockService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.systemEmailService = systemEmailService;
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
        assertNoBlockBetween(buyer, seller);
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

    /**
     * Danh sách hội thoại (tương thích cũ): không phân trang, tối đa {@value #MAX_SESSIONS_UNPAGED}.
     */
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(User user, String statusFilter) {
        ChatSessionPageResponse page = listSessionsFiltered(
                user, statusFilter, null, null, null, null, 0, MAX_SESSIONS_UNPAGED);
        return page.getContent() != null ? page.getContent() : List.of();
    }

    private static final int MAX_SESSIONS_UNPAGED = 2000;
    /** Giới hạn một request (FE mặc định 2000; có thể truyền page/size nhỏ hơn khi lọc). */
    private static final int MAX_SESSION_PAGE_SIZE = 2000;

    /**
     * Tìm / lọc danh sách hội thoại: {@code q} khớp (bỏ dấu) tiêu đề tin, tên đối phương, mã listing (chuỗi).
     * Tìm trong nội dung tin nhắn thực hiện trong phiên qua {@link #searchMessagesInSession}.
     */
    @Transactional(readOnly = true)
    public ChatSessionPageResponse listSessionsFiltered(User user, String statusFilter,
                                                        String q, Long listingId,
                                                        Instant updatedAfter, Instant updatedBefore,
                                                        int page, int size) {
        List<Conversation> convs = loadAccessibleConversations(user, statusFilter);
        List<ChatSessionResponse> rows = convs.stream()
                .map(c -> toSessionResponse(c, user))
                .collect(Collectors.toList());

        String trimmed = q != null ? q.trim() : "";
        final String qFolded = trimmed.isEmpty() ? "" : foldSearchText(trimmed.length() > 100 ? trimmed.substring(0, 100) : trimmed);

        List<ChatSessionResponse> filtered = new ArrayList<>();
        for (int i = 0; i < convs.size(); i++) {
            ChatSessionResponse s = rows.get(i);
            if (listingId != null && !Objects.equals(s.getListingId(), listingId)) {
                continue;
            }
            if (!matchesSessionTimeWindow(s, updatedAfter, updatedBefore)) {
                continue;
            }
            if (qFolded.isEmpty()) {
                filtered.add(s);
                continue;
            }
            if (matchesSessionMetaFolded(s, qFolded)) {
                filtered.add(s);
            }
        }

        long total = filtered.size();
        int safeSize = Math.min(MAX_SESSION_PAGE_SIZE, Math.max(1, size));
        int safePage = Math.max(0, page);
        int from = (int) Math.min((long) safePage * safeSize, total);
        int to = (int) Math.min(from + safeSize, total);
        List<ChatSessionResponse> pageContent = from < to ? filtered.subList(from, to) : List.of();
        int totalPages = safeSize == 0 ? 0 : (int) ((total + safeSize - 1) / safeSize);

        log.info("listSessionsFiltered userId={} totalFiltered={} page={} size={}", user.getId(), total, safePage, safeSize);
        return ChatSessionPageResponse.builder()
                .content(pageContent)
                .totalElements(total)
                .totalPages(totalPages)
                .number(safePage)
                .size(safeSize)
                .build();
    }

    private List<Conversation> loadAccessibleConversations(User user, String statusFilter) {
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
                Instant lb = b.getLastMessageAt() != null ? b.getLastMessageAt() : b.getCreatedAt();
                return lb.compareTo(la);
            });
        }
        int bySellerEmailCount = 0;
        if (email != null && !email.isBlank()) {
            List<Conversation> bySellerEmail = conversationRepository.findByListingSellerEmailOrderByLastMessageDesc(email);
            bySellerEmailCount = bySellerEmail.size();
            Set<Long> ids = list.stream().map(Conversation::getId).collect(Collectors.toSet());
            for (Conversation c : bySellerEmail) {
                if (!ids.contains(c.getId())) {
                    list.add(c);
                }
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
            if (extra > 0) {
                log.info("loadAccessibleConversations userId={} byListingSellerId extra={}", userId, extra);
            }
        }
        log.info("loadAccessibleConversations userId={} email={} byId={} byEmail={} bySellerEmail={} total={}",
                userId, email, byId.size(), byEmailCount, bySellerEmailCount, list.size());
        String currentEmail = email;
        return list.stream()
                .filter(c -> {
                    User u1 = c.getUserId1();
                    User u2 = c.getUserId2();
                    String e1 = u1 != null && u1.getEmail() != null ? u1.getEmail().trim().toLowerCase() : "";
                    String e2 = u2 != null && u2.getEmail() != null ? u2.getEmail().trim().toLowerCase() : "";
                    if (!e1.isEmpty() && e1.equals(e2)) {
                        return false;
                    }
                    User other = isCurrentParticipant(u1, user) ? u2 : u1;
                    if (other == null || currentEmail == null) {
                        return true;
                    }
                    String oe = other.getEmail() != null ? other.getEmail().trim().toLowerCase() : "";
                    return oe.isEmpty() || !oe.equals(currentEmail);
                })
                .filter(c -> {
                    User u1 = c.getUserId1();
                    User u2 = c.getUserId2();
                    User other = isCurrentParticipant(u1, user) ? u2 : u1;
                    if (other == null || other.getId() == null) {
                        return true;
                    }
                    return !blockService.isBlockedEitherDirection(user.getId(), other.getId());
                })
                .collect(Collectors.toList());
    }

    private static boolean matchesSessionTimeWindow(ChatSessionResponse s, Instant after, Instant before) {
        Instant t = s.getLastMessageAt() != null ? s.getLastMessageAt() : Instant.EPOCH;
        if (after != null && t.isBefore(after)) {
            return false;
        }
        if (before != null && t.isAfter(before)) {
            return false;
        }
        return true;
    }

    /** Chuẩn hóa chuỗi tìm kiếm: thường + bỏ dấu kết hợp (tiếng Việt). */
    private static String foldSearchText(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        String lower = input.toLowerCase(Locale.ROOT);
        return Normalizer.normalize(lower, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
    }

    private static boolean matchesSessionMetaFolded(ChatSessionResponse s, String qFolded) {
        if (qFolded.isEmpty()) {
            return true;
        }
        String title = foldSearchText(s.getListingTitle());
        String name = foldSearchText(s.getOtherParticipantName());
        if (title.contains(qFolded) || name.contains(qFolded)) {
            return true;
        }
        if (s.getListingId() != null) {
            String idStr = String.valueOf(s.getListingId());
            if (foldSearchText(idStr).contains(qFolded)) {
                return true;
            }
        }
        return false;
    }

    // ── Message history ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getHistory(String sessionId, int page, int size) {
        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        User current = userService.getCurrentUser();
        ensureParticipant(conv, current);
        assertNoBlockWithConversationPeer(conv, current);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"));
        Page<Message> msgPage = messageRepository.findByConversation_IdOrderBySentAtDesc(conv.getId(), pageable);
        Map<Long, Offer> offerByMessageId = mapOfferProposalsToOffers(msgPage.getContent(), conv);
        Map<Long, Message> refs = mapReferencedMessages(msgPage.getContent());
        List<ChatMessageResponse> rows = msgPage.getContent().stream()
                .map(m -> toMessageResponse(m, conv.getSessionUuid(), current, offerByMessageId.get(m.getId()), refs))
                .toList();
        return new PageImpl<>(rows, pageable, msgPage.getTotalElements());
    }

    /**
     * Tìm tin nhắn theo nội dung trong một phiên (LIKE, không full-text).
     */
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> searchMessagesInSession(String sessionId, String q, int page, int size) {
        if (q == null || q.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Tham số q là bắt buộc");
        }
        String trimmed = q.trim();
        if (trimmed.length() < 2) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "q phải có ít nhất 2 ký tự");
        }
        if (trimmed.length() > 200) {
            trimmed = trimmed.substring(0, 200);
        }
        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        User current = userService.getCurrentUser();
        ensureParticipant(conv, current);
        assertNoBlockWithConversationPeer(conv, current);
        int safeSize = Math.min(30, Math.max(5, size));
        Pageable pageable = PageRequest.of(Math.max(0, page), safeSize, Sort.by(Sort.Direction.DESC, "sentAt"));
        Page<Message> msgPage = messageRepository
                .findByConversation_IdAndDeletedAtIsNullAndContentContainingIgnoreCaseOrderBySentAtDesc(
                        conv.getId(), trimmed, pageable);
        Map<Long, Offer> offerByMessageId = mapOfferProposalsToOffers(msgPage.getContent(), conv);
        Map<Long, Message> refs = mapReferencedMessages(msgPage.getContent());
        List<ChatMessageResponse> rows = msgPage.getContent().stream()
                .map(m -> toMessageResponse(m, conv.getSessionUuid(), current, offerByMessageId.get(m.getId()), refs))
                .toList();
        return new PageImpl<>(rows, pageable, msgPage.getTotalElements());
    }

    /**
     * Lịch sử chat gọi {@link #toMessageResponse} không có Offer → offerStatus null → FE hiển thị nhầm "đã từ chối".
     * Ghép tin OFFER_PROPOSAL với bản ghi Offer (listing + buyer + thứ tự thời gian).
     */
    private Map<Long, Offer> mapOfferProposalsToOffers(List<Message> messages, Conversation conv) {
        Map<Long, Offer> out = new HashMap<>();
        Listing listing = conv.getListing();
        if (listing == null || messages == null || messages.isEmpty()) {
            return out;
        }
        Long listingId = listing.getId();
        Map<Long, List<Message>> byBuyer = messages.stream()
                .filter(m -> m.getMessageType() == MessageType.OFFER_PROPOSAL)
                .collect(Collectors.groupingBy(m -> m.getSender().getId()));

        for (Map.Entry<Long, List<Message>> e : byBuyer.entrySet()) {
            Long buyerId = e.getKey();
            List<Message> proposalMsgs = e.getValue().stream()
                    .sorted(Comparator.comparing(Message::getSentAt))
                    .toList();
            List<Offer> offers = new ArrayList<>(offerRepository
                    .findByListing_IdAndBuyer_IdOrderByCreatedAtDesc(listingId, buyerId, PageRequest.of(0, 100))
                    .getContent());
            Collections.reverse(offers);
            int n = Math.min(proposalMsgs.size(), offers.size());
            for (int i = 0; i < n; i++) {
                out.put(proposalMsgs.get(i).getId(), offers.get(i));
            }
        }
        return out;
    }

    // ── Send message (REST + WS shared path) ─────────────────────────────────

    /**
     * Send a TEXT or IMAGE message.
     * Rate limit: 1 msg/sec per user (BR-38).
     * Banned/restricted users are blocked (BR-34).
     * Pushes the message to the other participant via WebSocket.
     */
    @Transactional
    public ChatMessageResponse sendMessage(String sessionId, Long listingId, String content,
                                           MessageType messageType, String fileUrl,
                                           Long replyToMessageId, Long quoteMessageId,
                                           User sender) {
        checkNotBannedOrRestricted(sender);
        enforceRateLimit(sender);

        String resolvedSessionId = (sessionId != null && !sessionId.isBlank()) ? sessionId.trim() : null;
        if (resolvedSessionId == null) {
            if (listingId == null) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Cần sessionId hoặc listingId.");
            }
            Conversation created = getOrCreateSession(listingId, sender);
            resolvedSessionId = created.getSessionUuid();
        }

        Conversation conv = conversationRepository.findBySessionUuid(resolvedSessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        ensureParticipant(conv, sender);
        User other = getOtherParticipant(conv, sender);
        if (other != null) {
            assertNoBlockBetween(sender, other);
        }

        if (messageType == null) messageType = MessageType.TEXT;
        String resolvedContent = resolveContent(content, messageType, fileUrl);

        Message replyTo = resolveReferenceMessage(replyToMessageId, conv);
        Message quote = resolveReferenceMessage(quoteMessageId, conv);
        Message msg = buildMessage(conv, sender, resolvedContent, messageType, fileUrl, replyTo, quote);
        messageRepository.save(msg);

        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);
        lastMessageByUser.put(sender.getId(), msg.getSentAt());

        Map<Long, Message> refs = mapReferencedMessages(List.of(msg));
        ChatMessageResponse response = toMessageResponse(msg, conv.getSessionUuid(), sender, null, refs);

        // Push real-time to the other participant
        if (other != null) {
            notificationService.notifyNewMessage(other, response, resolvedSessionId);
        }
        // Also broadcast to the session topic so the sender's other tabs update
        broadcastToSession(resolvedSessionId, response);

        log.debug("sendMessage session={} sender={} type={}", resolvedSessionId, sender.getId(), messageType);
        return response;
    }

    // ── Image upload ──────────────────────────────────────────────────────────

    /**
     * Upload a chat image. Validates size and type.
     * Stores to uploads/chats/{sessionId}/{uuid}.ext
     * Returns the public URL path.
     */
    @Transactional(readOnly = true)
    public String uploadChatImage(String sessionId, Long listingId, MultipartFile file) {
        String resolvedSessionId = (sessionId != null && !sessionId.isBlank()) ? sessionId.trim() : null;
        if (resolvedSessionId == null) {
            if (listingId == null) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Cần sessionId hoặc listingId.");
            }
            User current = userService.getCurrentUser();
            Conversation created = getOrCreateSession(listingId, current);
            resolvedSessionId = created.getSessionUuid();
        }

        Conversation conv = conversationRepository.findBySessionUuid(resolvedSessionId)
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
        Path dir = uploadBasePath.resolve(Constants.CHAT_UPLOAD_DIR).resolve(resolvedSessionId);
        try {
            Files.createDirectories(dir);
            Path dest = dir.resolve(fileName);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Chat image upload failed session={}", resolvedSessionId, e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        return "/uploads/" + Constants.CHAT_UPLOAD_DIR + "/" + resolvedSessionId + "/" + fileName;
    }

    // ── Offer negotiation (UC-30) ─────────────────────────────────────────────

    /**
     * Make an offer: saves Offer entity + OFFER_PROPOSAL message.
     * At most one {@link OfferService#STATUS_PENDING} per buyer per listing until seller responds (anti-spam).
     */
    @Transactional
    public ChatMessageResponse makeOffer(String sessionId, BigDecimal amount, User buyer) {
        checkNotBannedOrRestricted(buyer);

        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        ensureParticipant(conv, buyer);
        User other = getOtherParticipant(conv, buyer);
        if (other != null) {
            assertNoBlockBetween(buyer, other);
        }

        Listing listing = conv.getListing();
        if (listing == null) throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SlifeException(ErrorCode.OFFER_PRICE_INVALID);
        }

        long pendingOffers = offerRepository.countByBuyer_IdAndListing_IdAndStatus(
                buyer.getId(), listing.getId(), OfferService.STATUS_PENDING);
        if (pendingOffers > 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT,
                    "Bạn đã có một lượt trả giá đang chờ người bán phản hồi. Vui lòng đợi được chấp nhận hoặc từ chối rồi mới gửi lượt mới.");
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
        Message msg = buildMessage(conv, buyer, content, MessageType.OFFER_PROPOSAL, null, null, null);
        messageRepository.save(msg);

        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);

        Map<Long, Message> refs = mapReferencedMessages(List.of(msg));
        ChatMessageResponse response = toMessageResponse(msg, conv.getSessionUuid(), buyer, offer, refs);

        User seller = getOtherParticipant(conv, buyer);
        if (seller != null) {
            // Chỉ thông báo đề xuất giá — không gửi thêm "tin nhắn mới" (cùng một bubble OFFER_PROPOSAL).
            notificationService.notifyOfferProposal(seller, buyer, listing.getId(), listing.getTitle(), amount);
            systemEmailService.sendOfferProposalEmail(
                    seller, emailDisplayNameForMail(buyer), listing.getTitle(), listing.getId(), amount);
        }
        broadcastToSession(sessionId, response);

        log.info("makeOffer session={} buyerId={} amount={} offerId={}", sessionId, buyer.getId(), amount, offer.getId());
        return response;
    }

    /**
     * Opens or reuses the listing chat then places an offer (no separate "open chat" call needed).
     */
    @Transactional
    public ChatMessageResponse makeOffer(Long listingId, BigDecimal amount, User buyer) {
        Conversation conv = getOrCreateSession(listingId, buyer);
        return makeOffer(conv.getSessionUuid(), amount, buyer);
    }

    // ── Respond to offer (UC-30 accept/reject) ────────────────────────────────

    /**
     * Seller accepts or rejects an offer.
     * If ACCEPTED: sends DEAL_CONFIRMATION system message + notifies both parties (listing stays ACTIVE until seller marks SOLD).
     */
    @Transactional
    public ChatMessageResponse respondToOffer(Long offerId, String action, User seller) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
        if (!OfferService.STATUS_PENDING.equals(offer.getStatus())) {
            throw new SlifeException(ErrorCode.OFFER_NOT_PENDING);
        }
        Conversation conv = offer.getConversation();
        if (conv == null) {
            Long listingId = offer.getListing() != null ? offer.getListing().getId() : null;
            Long buyerId = offer.getBuyer() != null ? offer.getBuyer().getId() : null;
            Long sellerId = offer.getListing() != null && offer.getListing().getSeller() != null
                    ? offer.getListing().getSeller().getId() : null;
            if (listingId == null || buyerId == null || sellerId == null) {
                throw new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND);
            }
            conv = conversationRepository.findActiveByListingBuyerSeller(listingId, buyerId, sellerId)
                    .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        }
        ensureParticipant(conv, seller);
        User buyer = offer.getBuyer();
        if (buyer != null) {
            assertNoBlockBetween(seller, buyer);
        }
        // Seller must not be the buyer
        if (offer.getBuyer().getId().equals(seller.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        boolean accepted = "ACCEPTED".equalsIgnoreCase(action);
        offer.setStatus(accepted ? OfferService.STATUS_ACCEPTED : OfferService.STATUS_REJECTED);
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        String sessionId = conv.getSessionUuid();
        // WS: cập nhật offerStatus trên bubble OFFER_PROPOSAL (FE không refetch full history).
        broadcastToSession(sessionId, Map.of(
                "event", "OFFER_STATUS",
                "offerId", offer.getId(),
                "status", accepted ? OfferService.STATUS_ACCEPTED : OfferService.STATUS_REJECTED));

        ChatMessageResponse response;

        if (accepted) {
            Listing listing = offer.getListing();
            // Listing stays ACTIVE until seller marks SOLD (PATCH /api/listings/{id}/sold).
            // System DEAL_CONFIRMATION message
            Message sysMsg = buildMessage(conv, seller, Constants.DEAL_CONFIRMED_MSG,
                    MessageType.DEAL_CONFIRMATION, null, null, null);
            messageRepository.save(sysMsg);
            conv.setLastMessageAt(sysMsg.getSentAt());
            conversationRepository.save(conv);
            Map<Long, Message> refs = mapReferencedMessages(List.of(sysMsg));
            response = toMessageResponse(sysMsg, sessionId, seller, offer, refs);

            // Notify both parties
            User acceptedBuyer = offer.getBuyer();
            if (listing != null) {
                notificationService.notifyDealConfirmed(acceptedBuyer, seller,
                        listing.getId(), listing.getTitle(), conv.getId());
                systemEmailService.sendOfferAcceptedEmails(
                        acceptedBuyer, seller, listing.getTitle(), listing.getId(), conv.getId(), null);
            }
            log.info("respondToOffer ACCEPTED offerId={} listingId={}", offerId,
                    listing != null ? listing.getId() : null);
        } else {
            // Rejected: just a short TEXT message
            Message rejMsg = buildMessage(conv, seller, "❌ Offer bị từ chối.", MessageType.TEXT, null, null, null);
            messageRepository.save(rejMsg);
            conv.setLastMessageAt(rejMsg.getSentAt());
            conversationRepository.save(conv);
            Map<Long, Message> refs = mapReferencedMessages(List.of(rejMsg));
            response = toMessageResponse(rejMsg, sessionId, seller, null, refs);
            Listing rejListing = offer.getListing();
            if (buyer != null && rejListing != null && offer.getAmount() != null) {
                User rejSeller = rejListing.getSeller() != null ? rejListing.getSeller() : seller;
                notificationService.notifyOfferRejected(buyer, rejSeller, rejListing.getId(),
                        rejListing.getTitle(), offer.getAmount());
                systemEmailService.sendOfferRejectedEmails(
                        buyer,
                        rejSeller,
                        rejListing.getTitle(),
                        rejListing.getId(),
                        offer.getAmount());
            }
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
        assertNoBlockWithConversationPeer(conv, reader);
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

    private void assertNoBlockBetween(User a, User b) {
        if (a == null || b == null) return;
        if (blockService.isBlockedEitherDirection(a.getId(), b.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "Chat is blocked between these users");
        }
    }

    private void assertNoBlockWithConversationPeer(Conversation conv, User current) {
        User other = getOtherParticipant(conv, current);
        if (other == null || other.getId() == null) {
            return;
        }
        assertNoBlockBetween(current, other);
    }

    private Message resolveReferenceMessage(Long refId, Conversation conv) {
        if (refId == null) return null;
        return messageRepository.findByIdAndConversation_IdAndDeletedAtIsNull(refId, conv.getId())
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Referenced message not found in this session"));
    }

    private Map<Long, Message> mapReferencedMessages(List<Message> messages) {
        if (messages == null || messages.isEmpty()) return Map.of();
        Set<Long> ids = new HashSet<>();
        for (Message m : messages) {
            if (m.getReplyToMessage() != null && m.getReplyToMessage().getId() != null) {
                ids.add(m.getReplyToMessage().getId());
            }
            if (m.getQuoteMessage() != null && m.getQuoteMessage().getId() != null) {
                ids.add(m.getQuoteMessage().getId());
            }
        }
        if (ids.isEmpty()) return Map.of();
        return messageRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Message::getId, x -> x, (a, b) -> a));
    }

    private MessageReferenceResponse toReference(Message m) {
        if (m == null) return null;
        User sender = m.getSender();
        return MessageReferenceResponse.builder()
                .id(m.getId())
                .senderId(sender != null ? sender.getId() : null)
                .senderName(sender != null ? sender.getFullName() : null)
                .content(m.getContent())
                .messageType(m.getMessageType())
                .fileUrl(m.getFileUrl())
                .build();
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
                                  MessageType type, String fileUrl,
                                  Message replyTo, Message quote) {
        Message msg = new Message();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setContent(content);
        msg.setMessageType(type);
        msg.setFileUrl(fileUrl);
        msg.setReplyToMessage(replyTo);
        msg.setQuoteMessage(quote);
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
        User other = getOtherParticipant(c, currentUser);
        if (other == null) {
            other = c.getUserId1().getId().equals(currentUserId) ? c.getUserId2() : c.getUserId1();
        }
        String otherName = other != null && other.getFullName() != null ? other.getFullName() : "";
        String otherAvatarUrl = null;
        if (other != null && other.getAvatarUrl() != null && !other.getAvatarUrl().isBlank()) {
            otherAvatarUrl = other.getAvatarUrl().trim();
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
                .otherParticipantAvatarUrl(otherAvatarUrl)
                .status(c.getStatus())
                .lastMessageAt(c.getLastMessageAt())
                .lastMessagePreview(lastMsg != null ? truncate(lastMsg.getContent(), 80) : null)
                .build();
    }

    private ChatMessageResponse toMessageResponse(Message m, String sessionUuid, User currentUser) {
        return toMessageResponse(m, sessionUuid, currentUser, null, Map.of());
    }

    private ChatMessageResponse toMessageResponse(Message m, String sessionUuid, User currentUser, Offer offer,
                                                  Map<Long, Message> refs) {
        User sender = m.getSender();
        boolean fromCurrent = currentUser != null && isCurrentParticipant(sender, currentUser);
        Long replyToId = m.getReplyToMessage() != null ? m.getReplyToMessage().getId() : null;
        Long quoteId = m.getQuoteMessage() != null ? m.getQuoteMessage().getId() : null;
        boolean delivered = true; // persisted in DB => delivered
        boolean seen = Boolean.TRUE.equals(m.getIsRead());
        String status = seen ? "SEEN" : (delivered ? "DELIVERED" : "SENT");
        Instant deliveredAt = m.getSentAt();
        Instant seenAt = seen ? (m.getUpdatedAt() != null ? m.getUpdatedAt() : m.getSentAt()) : null;
        Message replyToMsg = (replyToId != null && refs != null) ? refs.get(replyToId) : null;
        Message quoteMsg = (quoteId != null && refs != null) ? refs.get(quoteId) : null;
        Long ctxListingId = null;
        String ctxListingTitle = null;
        try {
            Conversation convCtx = m.getConversation();
            if (convCtx != null && convCtx.getListing() != null) {
                ctxListingId = convCtx.getListing().getId();
                ctxListingTitle = convCtx.getListing().getTitle();
            }
        } catch (Exception ignored) {
            // lazy / detached
        }
        return ChatMessageResponse.builder()
                .id(m.getId())
                .sessionId(sessionUuid)
                .listingId(ctxListingId)
                .listingTitle(ctxListingTitle)
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .content(m.getContent())
                .timestamp(m.getSentAt())
                .isRead(m.getIsRead())
                .isFromCurrentUser(fromCurrent)
                .messageType(m.getMessageType())
                .fileUrl(m.getFileUrl())
                .isDelivered(delivered)
                .isSeen(seen)
                .deliveryStatus(status)
                .deliveredAt(deliveredAt)
                .seenAt(seenAt)
                .offerId(offer != null ? offer.getId() : null)
                .offerAmount(offer != null ? offer.getAmount() : null)
                .offerStatus(offer != null ? offer.getStatus() : null)
                .replyToMessageId(replyToId)
                .replyTo(toReference(replyToMsg))
                .quoteMessageId(quoteId)
                .quote(toReference(quoteMsg))
                .build();
    }

    private static String emailDisplayNameForMail(User u) {
        if (u == null) {
            return "Người dùng";
        }
        if (u.getFullName() != null && !u.getFullName().isBlank()) {
            return u.getFullName().trim();
        }
        if (u.getEmail() != null && !u.getEmail().isBlank()) {
            return u.getEmail().trim();
        }
        return "Người dùng";
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
