package com.slife.marketplace.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.response.AuditLogEntryDTO;
import com.slife.marketplace.entity.AuditLog;
import com.slife.marketplace.entity.Report;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuditLogService {

    public static final String ACTOR_ADMIN = "ADMIN";
    public static final String ACTOR_SYSTEM = "SYSTEM";

    public static final String ACTION_USER_BAN = "USER_BAN";
    public static final String ACTION_USER_UNBAN = "USER_UNBAN";
    public static final String ACTION_COMMENT_DELETE_ADMIN = "COMMENT_DELETE_ADMIN";
    public static final String ACTION_REPORT_APPROVE = "REPORT_APPROVE";
    public static final String ACTION_REPORT_REJECT = "REPORT_REJECT";
    public static final String ACTION_AUTO_HIDE_LISTING = "AUTO_HIDE_LISTING";
    public static final String ACTION_AUTO_HIDE_COMMENT = "AUTO_HIDE_COMMENT";

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Page<AuditLogEntryDTO> list(int page, int size, String action) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(p, s);
        String act = (action != null && !action.isBlank()) ? action.trim() : null;
        Page<AuditLog> pageResult = act == null
                ? auditLogRepository.findAllByOrderByOccurredAtDesc(pageable)
                : auditLogRepository.findAllByActionOrderByOccurredAtDesc(act, pageable);
        return pageResult.map(this::toDto);
    }

    @Transactional
    public void logUserBan(User admin, Long targetUserId, String previousStatus) {
        log(admin, ACTOR_ADMIN, ACTION_USER_BAN, "USER", targetUserId,
                Map.of("previousStatus", previousStatus != null ? previousStatus : "", "newStatus", "BANNED"));
    }

    @Transactional
    public void logUserUnban(User admin, Long targetUserId, String previousStatus) {
        log(admin, ACTOR_ADMIN, ACTION_USER_UNBAN, "USER", targetUserId,
                Map.of("previousStatus", previousStatus != null ? previousStatus : "", "newStatus", "ACTIVE"));
    }

    @Transactional
    public void logAdminCommentDelete(User admin, Long commentId, Long listingId) {
        log(admin, ACTOR_ADMIN, ACTION_COMMENT_DELETE_ADMIN, "COMMENT", commentId,
                Map.of("listingId", listingId != null ? listingId : 0L));
    }

    @Transactional
    public void logReportProcessed(User admin, Report report, boolean approved) {
        if (report == null) {
            return;
        }
        String action = approved ? ACTION_REPORT_APPROVE : ACTION_REPORT_REJECT;
        Map<String, Object> payload = new HashMap<>();
        payload.put("reportId", report.getId());
        payload.put("targetType", report.getTargetType());
        payload.put("targetId", report.getTargetId());
        log(admin, ACTOR_ADMIN, action, "REPORT", report.getId(), payload);
    }

    @Transactional
    public void logAutoHideListing(Long listingId, int pendingReportCount, int threshold) {
        log(null, ACTOR_SYSTEM, ACTION_AUTO_HIDE_LISTING, "LISTING", listingId,
                Map.of("pendingReportCount", pendingReportCount, "threshold", threshold));
    }

    @Transactional
    public void logAutoHideComment(Long commentId, int pendingReportCount, int threshold) {
        log(null, ACTOR_SYSTEM, ACTION_AUTO_HIDE_COMMENT, "COMMENT", commentId,
                Map.of("pendingReportCount", pendingReportCount, "threshold", threshold));
    }

    private void log(User actor, String actorType, String action, String entityType, Long entityId, Map<String, ?> payload) {
        AuditLog row = new AuditLog();
        row.setOccurredAt(Instant.now());
        row.setActor(actor);
        row.setActorType(actorType);
        row.setAction(action);
        row.setEntityType(entityType);
        row.setEntityId(entityId);
        if (payload != null && !payload.isEmpty()) {
            try {
                row.setPayloadJson(objectMapper.writeValueAsString(payload));
            } catch (JsonProcessingException e) {
                row.setPayloadJson("{}");
            }
        }
        auditLogRepository.save(row);
    }

    private AuditLogEntryDTO toDto(AuditLog a) {
        Long actorId = a.getActor() != null ? a.getActor().getId() : null;
        return new AuditLogEntryDTO(
                a.getId(),
                a.getOccurredAt(),
                actorId,
                a.getActorType(),
                a.getAction(),
                a.getEntityType(),
                a.getEntityId(),
                a.getPayloadJson());
    }
}
