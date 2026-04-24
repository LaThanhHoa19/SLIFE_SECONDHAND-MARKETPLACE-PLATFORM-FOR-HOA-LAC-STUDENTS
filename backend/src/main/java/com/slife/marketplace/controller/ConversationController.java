package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateConversationMessageRequest;
import com.slife.marketplace.dto.request.CreateConversationRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.dto.response.ConversationMessageResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.service.ConversationService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.Constants;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.sql.Timestamp;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class ConversationController {
    private final JdbcTemplate jdbcTemplate;
    private final ConversationService conversationService;
    private final UserService userService;
    private static final DateTimeFormatter CHAT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public ConversationController(JdbcTemplate jdbcTemplate,
                                  ConversationService conversationService,
                                  UserService userService) {
        this.jdbcTemplate = jdbcTemplate;
        this.conversationService = conversationService;
        this.userService = userService;
    }

    @GetMapping("/api/conversations")
    public ResponseEntity<?> m1() {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/conversations")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> m2(@Valid @RequestBody CreateConversationRequest r) {
        ChatSessionResponse session = conversationService.getOrCreateConversation(r.getListingId());
        return ResponseEntity.ok(ApiResponse.success("OK", session));
    }

    @GetMapping("/api/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<PagedResponse<ConversationMessageResponse>>> m3(
            @PathVariable("id") Long id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        User currentUser = userService.getCurrentUser();
        ensureConversationParticipant(id, currentUser);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(20, Math.max(1, size));
        int offset = safePage * safeSize;

        long totalElements = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM messages WHERE conversation_id = ?",
                Long.class,
                id
        );
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / safeSize);

        List<ConversationMessageResponse> descRows = jdbcTemplate.query(
                """
                SELECT u.full_name AS sender_name, m.content AS content, m.sent_at AS sent_at
                FROM messages m
                JOIN users u ON u.user_id = m.sender_id
                WHERE m.conversation_id = ?
                ORDER BY m.sent_at DESC, m.message_id DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> {
                    ConversationMessageResponse dto = new ConversationMessageResponse();
                    dto.setSenderName(rs.getString("sender_name"));
                    dto.setContent(rs.getString("content"));
                    Timestamp sentAt = rs.getTimestamp("sent_at");
                    dto.setFormattedTime(sentAt != null ? CHAT_TIME_FORMATTER.format(sentAt.toInstant()) : null);
                    return dto;
                },
                id,
                safeSize,
                offset
        );

        List<ConversationMessageResponse> ascendingContent = new ArrayList<>();
        for (int i = descRows.size() - 1; i >= 0; i--) {
            ascendingContent.add(descRows.get(i));
        }

        PagedResponse<ConversationMessageResponse> data = new PagedResponse<>(
                ascendingContent,
                safePage,
                safeSize,
                totalElements,
                totalPages
        );
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @PostMapping("/api/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> m4(
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateConversationMessageRequest request) {
        ChatMessageResponse saved = conversationService.createMessage(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("OK", saved));
    }

    private void ensureConversationParticipant(Long conversationId, User currentUser) {
        Map<String, Object> row;
        try {
            row = jdbcTemplate.queryForMap(
                    "SELECT user_id1, user_id2 FROM conversations WHERE conversation_id = ?",
                    conversationId
            );
        } catch (Exception ex) {
            throw new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND);
        }

        Long userId1 = ((Number) row.get("user_id1")).longValue();
        Long userId2 = ((Number) row.get("user_id2")).longValue();
        boolean isParticipant = userId1.equals(currentUser.getId()) || userId2.equals(currentUser.getId());
        if (!isParticipant) {
            throw new SlifeException(ErrorCode.FORBIDDEN, Constants.MSG23);
        }
    }
}
