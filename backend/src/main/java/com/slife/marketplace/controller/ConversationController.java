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
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.Constants;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class ConversationController {
    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;
    private static final DateTimeFormatter CHAT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public ConversationController(JdbcTemplate jdbcTemplate,
                                  UserService userService) {
        this.jdbcTemplate = jdbcTemplate;
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

        // Query newest first for efficient pagination, then reverse for UI old -> new.
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
        User sender = userService.getCurrentUser();
        ensureConversationParticipant(id, sender);
        if (sender.getStatus() != null
                && ("BANNED".equals(sender.getStatus()) || "RESTRICTED".equals(sender.getStatus()))) {
            throw new SlifeException(ErrorCode.FORBIDDEN, Constants.MSG23);
        }

        Instant now = Instant.now();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                    """
                    INSERT INTO messages (conversation_id, sender_id, content, is_read, sent_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, id);
            ps.setLong(2, sender.getId());
            ps.setString(3, request.getContent().trim());
            ps.setBoolean(4, false);
            ps.setTimestamp(5, Timestamp.from(now));
            ps.setTimestamp(6, Timestamp.from(now));
            return ps;
        }, keyHolder);

        jdbcTemplate.update(
                "UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE conversation_id = ?",
                Timestamp.from(now), Timestamp.from(now), id
        );

        Number key = keyHolder.getKey();
        ChatMessageResponse saved = ChatMessageResponse.builder()
                .id(key != null ? key.longValue() : null)
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .content(request.getContent().trim())
                .timestamp(now)
                .isRead(false)
                .isFromCurrentUser(true)
                .build();
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