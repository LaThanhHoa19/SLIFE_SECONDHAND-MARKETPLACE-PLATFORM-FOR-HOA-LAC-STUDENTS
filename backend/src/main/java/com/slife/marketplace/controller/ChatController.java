package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.MakeOfferRequest;
import com.slife.marketplace.dto.request.OfferResponseRequest;
import com.slife.marketplace.dto.request.SendMessageRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.entity.MessageType;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * REST API + WebSocket handlers for the chat system (FE-05).
 *
 * REST endpoints:
 *   GET  /api/v1/chats                          – list sessions
 *   POST /api/v1/chats/session                  – get-or-create session
 *   POST /api/v1/chats/send                     – send message (REST fallback)
 *   GET  /api/v1/chats/{sessionId}/history      – paginated history
 *   GET  /api/v1/chats/quick-replies            – quick reply phrases
 *   POST /api/v1/chats/upload                   – upload chat image (returns URL)
 *   POST /api/v1/chats/{sessionId}/offer        – make offer (UC-30 / BR-35)
 *   POST /api/v1/chats/offers/{offerId}/respond – accept or reject offer
 *   POST /api/v1/chats/{sessionId}/read         – mark all messages read (UC-26)
 *
 * WebSocket destinations (app prefix /app):
 *   /app/chat.send    – real-time send
 *   /app/chat.typing  – typing indicator broadcast
 */
@RestController
@RequestMapping("/api/v1")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final UserService userService;
    private final UserRepository userRepository;

    public ChatController(ChatService chatService,
                          UserService userService,
                          UserRepository userRepository) {
        this.chatService = chatService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // ── Sessions ──────────────────────────────────────────────────────────────

    @GetMapping("/chats")
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> listChats(
            @RequestParam(defaultValue = "ALL") String filter) {
        User user = userService.getCurrentUser();
        List<ChatSessionResponse> list = chatService.listSessions(user, filter);
        log.info("GET /chats userId={} filter={} count={}", user.getId(), filter, list.size());
        return ResponseEntity.ok(ApiResponse.success(list.isEmpty() ? Constants.MSG01 : "OK", list));
    }

    @PostMapping("/chats/session")
    public ResponseEntity<ApiResponse<String>> getOrCreateSession(@RequestParam Long listingId) {
        User current = userService.getCurrentUser();
        var conv = chatService.getOrCreateSession(listingId, current);
        return ResponseEntity.ok(ApiResponse.success("OK", conv.getSessionUuid()));
    }

    // ── Messaging ─────────────────────────────────────────────────────────────

    /** REST fallback – also pushes via WebSocket internally. */
    @PostMapping("/chats/send")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {
        User user = userService.getCurrentUser();
        MessageType type = request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT;
        ChatMessageResponse msg = chatService.sendMessage(
                request.getSessionId(), request.getContent(), type, request.getFileUrl(), user);
        return ResponseEntity.ok(ApiResponse.success("OK", msg));
    }

    @GetMapping("/chats/{sessionId}/history")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getHistory(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        int safeSize = Math.min(20, Math.max(10, size));
        return ResponseEntity.ok(ApiResponse.success("OK", chatService.getHistory(sessionId, page, safeSize)));
    }

    @GetMapping("/chats/quick-replies")
    public ResponseEntity<ApiResponse<List<String>>> quickReplies() {
        return ResponseEntity.ok(ApiResponse.success("OK", QuickReplyUtil.getQuickReplies()));
    }

    // ── Image upload ──────────────────────────────────────────────────────────

    /**
     * Upload a chat image. Returns the public URL.
     * Max 5 MB, accepts JPG / PNG / WebP only.
     * Client then sends a message with messageType=IMAGE and that fileUrl.
     */
    @PostMapping(value = "/chats/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadChatImage(
            @RequestParam String sessionId,
            @RequestParam("file") MultipartFile file) {
        String url = chatService.uploadChatImage(sessionId, file);
        return ResponseEntity.ok(ApiResponse.success("OK", url));
    }

    // ── Negotiation ───────────────────────────────────────────────────────────

    /** Buyer makes a price offer (UC-30). BR-35: max 5 per listing. */
    @PostMapping("/chats/{sessionId}/offer")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> makeOffer(
            @PathVariable String sessionId,
            @Valid @RequestBody MakeOfferRequest request) {
        User buyer = userService.getCurrentUser();
        BigDecimal amount = request.getAmount();
        return ResponseEntity.ok(ApiResponse.success("OK", chatService.makeOffer(sessionId, amount, buyer)));
    }

    /** Seller accepts or rejects an offer. */
    @PostMapping("/chats/offers/{offerId}/respond")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> respondToOffer(
            @PathVariable Long offerId,
            @Valid @RequestBody OfferResponseRequest request) {
        User seller = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", chatService.respondToOffer(offerId, request.getAction(), seller)));
    }

    // ── Read receipts ─────────────────────────────────────────────────────────

    @PostMapping("/chats/{sessionId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String sessionId) {
        User user = userService.getCurrentUser();
        chatService.markSessionAsRead(sessionId, user);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    // ── WebSocket handlers ────────────────────────────────────────────────────

    /**
     * Real-time send via STOMP WebSocket.
     * Payload: { sessionId, content, messageType?, fileUrl? }
     *
     * IMPORTANT: SecurityContextHolder is empty in WS threads.
     * The user is resolved from the STOMP principal (= user email, set by JwtHandshakeHandler).
     */
    @MessageMapping("/chat.send")
    public void wsSendMessage(@Payload SendMessageRequest request,
                              SimpMessageHeaderAccessor headerAccessor) {
        User sender = resolveUserFromPrincipal(headerAccessor.getUser());
        if (sender == null) return;
        try {
            MessageType type = request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT;
            chatService.sendMessage(
                    request.getSessionId(), request.getContent(), type, request.getFileUrl(), sender);
        } catch (Exception ex) {
            log.warn("wsSendMessage failed userId={}: {}", sender.getId(), ex.getMessage());
        }
    }

    /**
     * Typing indicator via STOMP.
     * Payload: { sessionId, isTyping }
     */
    @MessageMapping("/chat.typing")
    public void wsTyping(@Payload Map<String, Object> payload,
                         SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        try {
            String sessionId = (String) payload.get("sessionId");
            boolean isTyping  = Boolean.TRUE.equals(payload.get("isTyping"));
            if (sessionId != null) {
                chatService.broadcastTyping(sessionId, principal.getName(), isTyping);
            }
        } catch (Exception ex) {
            log.warn("wsTyping failed: {}", ex.getMessage());
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private User resolveUserFromPrincipal(Principal principal) {
        if (principal == null) return null;
        String email = principal.getName();
        if (email == null || email.isBlank()) return null;
        return userRepository.findByEmail(email).orElse(null);
    }
}
