package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.request.SendMessageRequest;
import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.ChatService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.Constants;
import com.slife.marketplace.util.QuickReplyUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

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

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    /**
     * List all conversations for current user with optional filter.
     * Filter: ALL, ACTIVE, CLOSED, SPAM (or Negotiating = ACTIVE).
     */
    @GetMapping("/chats")
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> listChats(
            @RequestParam(required = false, defaultValue = "ALL") String filter) {
        User user = userService.getCurrentUser();
        List<ChatSessionResponse> list = chatService.listSessions(user, filter);
        log.info("GET /chats userId={} email={} filter={} count={}", user.getId(), user.getEmail(), filter, list.size());
        String message = list.isEmpty() ? Constants.MSG01 : Constants.MSG10;
        return ResponseEntity.ok(ApiResponse.success(message, list));
    }

    /**
     * Get or create chat session for a listing (current user = buyer). Returns sessionId (UUID).
     */
    @PostMapping("/chats/session")
    public ResponseEntity<ApiResponse<String>> getOrCreateSession(@RequestParam Long listingId) {
        User current = userService.getCurrentUser();
        var conv = chatService.getOrCreateSession(listingId, current);
        return ResponseEntity.ok(ApiResponse.success("OK", conv.getSessionUuid()));
    }

    /**
     * Send a message in a session (REST fallback; real-time dùng WebSocket /app/chat.send).
     */
    @PostMapping("/chats/send")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        User user = userService.getCurrentUser();
        ChatMessageResponse msg = chatService.sendMessage(request.getSessionId(), request.getContent(), user);
        return ResponseEntity.ok(ApiResponse.success(Constants.MSG10, msg));
    }

    /**
     * Paginated message history for a session. 10–20 items per page.
     */
    @GetMapping("/chats/{sessionId}/history")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getHistory(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        int safeSize = Math.min(20, Math.max(10, size));
        Page<ChatMessageResponse> data = chatService.getHistory(sessionId, page, safeSize);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** Quick Reply: common phrases for chat. */
    @GetMapping("/chats/quick-replies")
    public ResponseEntity<ApiResponse<List<String>>> quickReplies() {
        return ResponseEntity.ok(ApiResponse.success("OK", QuickReplyUtil.getQuickReplies()));
    }
}
