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
 * REST API for chat: list sessions, paginated history.
 * GET /api/v1/chats, GET /api/v1/chats/{sessionId}/history
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

    /**
     * List all conversations for current user with optional filter.
     * Filter: ALL, ACTIVE, CLOSED, SPAM (or Negotiating = ACTIVE).
     */
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

    /**
     * Send a message in a session (REST fallback; real-time dùng WebSocket /app/chat.send).
     * Uses enhanced ChatService with messageType/fileUrl support.
     */
    @PostMapping("/chats/send")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {
        User user = userService.getCurrentUser();
        ChatMessageResponse msg = chatService.sendMessage(
                request.getSessionId(),
                request.getContent(),
                request.getMessageType(),
                request.getFileUrl(),
                user);
        return ResponseEntity.ok(ApiResponse.success(Constants.MSG10, msg));
    }

    @GetMapping("/chats/{sessionId}/history")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getHistory(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        int safeSize = Math.min(20, Math.max(10, size));
        Page<ChatMessageResponse> data = chatService.getHistory(sessionId, page, safeSize);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @GetMapping("/chats/quick-replies")
    public ResponseEntity<ApiResponse<List<String>>> quickReplies() {
        return ResponseEntity.ok(ApiResponse.success("OK", QuickReplyUtil.getQuickReplies()));
    }

    /**
     * Real-time send via WebSocket.
     * Client sends to /app/chat.send with payload:
     * { sessionId, content, messageType?, fileUrl? }
     */
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
                    request.getContent(),
                    request.getMessageType(),
                    request.getFileUrl(),
                    sender);
        } catch (Exception ex) {
            log.warn("wsSendMessage failed principal={}: {}", principal.getName(), ex.getMessage());
        }
    }

    /**
     * Typing indicator.
     * Client sends to /app/chat.typing with payload:
     * { sessionId, isTyping }
     */
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
