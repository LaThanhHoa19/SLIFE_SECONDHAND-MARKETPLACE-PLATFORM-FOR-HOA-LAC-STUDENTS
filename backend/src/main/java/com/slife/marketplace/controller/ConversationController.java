/**
 * Mục đích: Controller Conversation
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateConversationMessageRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.MessageType;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.service.ChatService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
public class ConversationController {
    private final ConversationRepository conversationRepository;
    private final ChatService chatService;
    private final UserService userService;

    public ConversationController(ConversationRepository conversationRepository,
                                  ChatService chatService,
                                  UserService userService) {
        this.conversationRepository = conversationRepository;
        this.chatService = chatService;
        this.userService = userService;
    }

    // TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.
    @GetMapping("/api/conversations")
    public ResponseEntity<?> m1() {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/conversations")
    public ResponseEntity<?> m2(@RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/conversations/{id}/messages")
    public ResponseEntity<?> m3(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> m4(
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateConversationMessageRequest request) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        String sessionId = conversation.getSessionUuid();
        if (sessionId == null || sessionId.isBlank()) {
            throw new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND);
        }

        User sender = userService.getCurrentUser();
        ChatMessageResponse saved = chatService.sendMessage(
                sessionId,
                request.getContent(),
                MessageType.TEXT,
                null,
                sender
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("OK", saved));
    }
}