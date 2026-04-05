package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.MakeOfferByListingRequest;
import com.slife.marketplace.dto.request.MakeOfferRequest;
import com.slife.marketplace.dto.request.OfferResponseRequest;
import com.slife.marketplace.dto.request.SendMessageRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionPageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.service.ChatService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.Constants;
import com.slife.marketplace.util.QuickReplyUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.Instant;
import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * REST API + WebSocket handlers for the chat system (FE-05).
 * * REST endpoints:
 * GET  /api/v1/chats                          – list sessions (q: tiêu đề tin + tên; page trong data)
 * GET  /api/v1/chats/{sessionId}/messages/search?q= – search text in session
 * POST /api/v1/chats/session                  – get-or-create session
 * POST /api/v1/chats/send                     – send message (REST fallback)
 * GET  /api/v1/chats/{sessionId}/history      – paginated history
 * GET  /api/v1/chats/quick-replies            – quick reply phrases
 * POST /api/v1/chats/upload                   – upload chat image
 * POST /api/v1/chats/{sessionId}/offer        – make offer (UC-30)
 * POST /api/v1/chats/offers/{offerId}/respond – accept/reject offer
 * POST /api/v1/chats/{sessionId}/read         – mark messages read (UC-26)
 * * WebSocket destinations (prefix /app):
 * /app/chat.send    – send a message in real-time
 * /app/chat.typing  – broadcast typing indicator
 */
@RestController
@RequestMapping("/api/v1")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final UserService userService;
    private final UserRepository userRepository;

    public ChatController(ChatService chatService, UserService userService, UserRepository userRepository) {
        this.chatService = chatService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // ── SESSION MANAGEMENT ────────────────────────────────────────────────────

    @GetMapping("/chats")
    public ResponseEntity<ApiResponse<ChatSessionPageResponse>> listChats(
            @RequestParam(defaultValue = "ALL") String filter,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long listingId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant updatedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant updatedBefore,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        User user = userService.getCurrentUser();
        int p = page != null ? page : 0;
        int s = size != null ? size : 2000;
        ChatSessionPageResponse data = chatService.listSessionsFiltered(
                user, filter, q, listingId, updatedAfter, updatedBefore, p, s);
        log.info("GET /chats userId={} filter={} totalElements={}", user.getId(), filter, data.getTotalElements());
        boolean empty = data.getContent() == null || data.getContent().isEmpty();
        return ResponseEntity.ok(ApiResponse.success(empty ? Constants.MSG01 : "OK", data));
    }

    @PostMapping("/chats/session")
    public ResponseEntity<ApiResponse<String>> getOrCreateSession(@RequestParam(name = "listingId") Long listingId) {
        User current = userService.getCurrentUser();
        var conv = chatService.getOrCreateSession(listingId, current);
        return ResponseEntity.ok(ApiResponse.success("OK", conv.getSessionUuid()));
    }

    // ── MESSAGING (REST) ──────────────────────────────────────────────────────

    @PostMapping("/chats/send")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {
        User user = userService.getCurrentUser();
        ChatMessageResponse msg = chatService.sendMessage(
                request.getSessionId(),
                request.getListingId(),
                request.getContent(),
                request.getMessageType(),
                request.getFileUrl(),
                request.getReplyToMessageId(),
                request.getQuoteMessageId(),
                user);
        return ResponseEntity.ok(ApiResponse.success(Constants.MSG10, msg));
    }

    @GetMapping("/chats/{sessionId}/history")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getHistory(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        // Cho phép tới 50 tin/trang (FE dùng ~30 + tải thêm khi cuộn lên); vẫn chặn trần để tránh abuse.
        int safeSize = Math.min(50, Math.max(10, size));
        Page<ChatMessageResponse> data = chatService.getHistory(sessionId, page, safeSize);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** Tìm tin nhắn theo nội dung trong phiên (q tối thiểu 2 ký tự). */
    @GetMapping("/chats/{sessionId}/messages/search")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> searchSessionMessages(
            @PathVariable String sessionId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<ChatMessageResponse> data = chatService.searchMessagesInSession(sessionId, q, page, size);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @GetMapping("/chats/quick-replies")
    public ResponseEntity<ApiResponse<List<String>>> quickReplies() {
        return ResponseEntity.ok(ApiResponse.success("OK", QuickReplyUtil.getQuickReplies()));
    }

    // ── IMAGE UPLOAD ─────────────────────────────────────────────────────────

    @PostMapping(value = "/chats/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadChatImage(
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) Long listingId,
            @RequestParam("file") MultipartFile file) {
        String url = chatService.uploadChatImage(sessionId, listingId, file);
        return ResponseEntity.ok(ApiResponse.success("OK", url));
    }

    // ── NEGOTIATION & OFFERS ──────────────────────────────────────────────────

    @PostMapping("/chats/{sessionId}/offer")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> makeOffer(
            @PathVariable String sessionId,
            @Valid @RequestBody MakeOfferRequest request) {
        User buyer = userService.getCurrentUser();
        BigDecimal amount = request.getAmount();
        ChatMessageResponse msg = chatService.makeOffer(sessionId, amount, buyer);
        return ResponseEntity.ok(ApiResponse.success("OK", msg));
    }

    /** Buyer makes an offer without knowing session UUID (session resolved from listing). */
    @PostMapping("/chats/offers")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> makeOfferByListing(
            @Valid @RequestBody MakeOfferByListingRequest request) {
        User buyer = userService.getCurrentUser();
        ChatMessageResponse msg = chatService.makeOffer(request.getListingId(), request.getAmount(), buyer);
        return ResponseEntity.ok(ApiResponse.success("OK", msg));
    }

    @PostMapping("/chats/offers/{offerId}/respond")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> respondToOffer(
            @PathVariable Long offerId,
            @Valid @RequestBody OfferResponseRequest request) {
        User seller = userService.getCurrentUser();
        ChatMessageResponse msg = chatService.respondToOffer(offerId, request.getAction(), seller);
        return ResponseEntity.ok(ApiResponse.success("OK", msg));
    }

    // ── READ RECEIPTS ─────────────────────────────────────────────────────────

    @PostMapping("/chats/{sessionId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String sessionId) {
        User user = userService.getCurrentUser();
        chatService.markSessionAsRead(sessionId, user);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    // ── WEBSOCKET HANDLERS ────────────────────────────────────────────────────

    @MessageMapping("/chat.send")
    public void wsSendMessage(@Payload SendMessageRequest request, SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        
        String email = principal.getName();
        if (email == null || email.isBlank()) return;

        try {
            User sender = userRepository.findByEmail(email).orElse(null);
            if (sender == null) {
                log.warn("wsSendMessage failed: user not found for email={}", email);
                return;
            }
            chatService.sendMessage(
                    request.getSessionId(),
                    request.getListingId(),
                    request.getContent(),
                    request.getMessageType(),
                    request.getFileUrl(),
                    request.getReplyToMessageId(),
                    request.getQuoteMessageId(),
                    sender);
        } catch (Exception ex) {
            log.warn("wsSendMessage failed principal={}: {}", principal.getName(), ex.getMessage());
        }
    }

    @MessageMapping("/chat.typing")
    public void wsTyping(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        
        try {
            String sessionId = (String) payload.get("sessionId");
            Boolean isTyping = Boolean.TRUE.equals(payload.get("isTyping"));
            if (sessionId != null) {
                chatService.broadcastTyping(sessionId, principal.getName(), isTyping);
            }
        } catch (Exception ex) {
            log.warn("wsTyping failed: {}", ex.getMessage());
        }
    }
}