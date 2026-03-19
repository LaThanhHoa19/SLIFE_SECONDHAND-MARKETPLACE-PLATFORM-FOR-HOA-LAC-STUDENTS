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
import com.slife.marketplace.dto.response.ConversationMessageResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Message;
import com.slife.marketplace.entity.MessageType;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.service.ChatService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.Constants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@RestController
public class ConversationController {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ChatService chatService;
    private final UserService userService;
    private static final DateTimeFormatter CHAT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public ConversationController(ConversationRepository conversationRepository,
                                  MessageRepository messageRepository,
                                  ChatService chatService,
                                  UserService userService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
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
    public ResponseEntity<ApiResponse<PagedResponse<ConversationMessageResponse>>> m3(
            @PathVariable("id") Long id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        User currentUser = userService.getCurrentUser();
        ensureConversationParticipant(conversation, currentUser);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(20, Math.max(1, size));

        // Query newest first for "recent messages" pagination, then reverse for UI old -> new.
        Page<Message> messagePage = messageRepository.findByConversation_IdOrderBySentAtDesc(
                id,
                PageRequest.of(safePage, safeSize)
        );

        List<ConversationMessageResponse> ascendingContent = new ArrayList<>();
        List<Message> descItems = messagePage.getContent();
        for (int i = descItems.size() - 1; i >= 0; i--) {
            Message msg = descItems.get(i);
            ConversationMessageResponse dto = new ConversationMessageResponse();
            dto.setSenderName(msg.getSender() != null ? msg.getSender().getFullName() : "Unknown");
            dto.setContent(msg.getContent());
            dto.setFormattedTime(msg.getSentAt() != null ? CHAT_TIME_FORMATTER.format(msg.getSentAt()) : null);
            ascendingContent.add(dto);
        }

        PagedResponse<ConversationMessageResponse> data = new PagedResponse<>(
                ascendingContent,
                messagePage.getNumber(),
                messagePage.getSize(),
                messagePage.getTotalElements(),
                messagePage.getTotalPages()
        );
        return ResponseEntity.ok(ApiResponse.success("OK", data));
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

    private void ensureConversationParticipant(Conversation conversation, User currentUser) {
        boolean isParticipant = conversation.getUserId1() != null && conversation.getUserId1().getId().equals(currentUser.getId())
                || conversation.getUserId2() != null && conversation.getUserId2().getId().equals(currentUser.getId());
        if (!isParticipant) {
            throw new SlifeException(ErrorCode.FORBIDDEN, Constants.MSG23);
        }
    }
}