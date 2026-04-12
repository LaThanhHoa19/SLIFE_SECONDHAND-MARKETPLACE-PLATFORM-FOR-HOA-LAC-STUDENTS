package com.slife.marketplace.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.response.AuditLogEntryDTO;
import com.slife.marketplace.entity.AuditLog;
import com.slife.marketplace.entity.Report;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @Mock private ObjectMapper objectMapper;

    private AuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogService(auditLogRepository, objectMapper);
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    private static AuditLog row(long id, User actor, String action, String entityType, Long entityId, String payload) {
        AuditLog a = new AuditLog();
        a.setId(id);
        a.setOccurredAt(Instant.parse("2026-01-01T00:00:00Z"));
        a.setActor(actor);
        a.setActorType(actor != null ? AuditLogService.ACTOR_ADMIN : AuditLogService.ACTOR_SYSTEM);
        a.setAction(action);
        a.setEntityType(entityType);
        a.setEntityId(entityId);
        a.setPayloadJson(payload);
        return a;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Danh sách (list)")
    class ListLogs {

        @Test
        @DisplayName("action null/blank → gọi findAllByOrderByOccurredAtDesc; page/size normalize")
        void list_withoutAction_shouldListAll() {
            when(auditLogRepository.findAllByOrderByOccurredAtDesc(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(row(1L, user(9L), "X", "USER", 1L, "{}"))));

            Page<AuditLogEntryDTO> out = auditLogService.list(-1, 0, "   ");

            assertEquals(1, out.getTotalElements());
            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(auditLogRepository).findAllByOrderByOccurredAtDesc(cap.capture());
            assertEquals(0, cap.getValue().getPageNumber());
            assertEquals(20, cap.getValue().getPageSize());
        }

        @Test
        @DisplayName("action có giá trị → gọi findAllByActionOrderByOccurredAtDesc")
        void list_withAction_shouldFilter() {
            when(auditLogRepository.findAllByActionOrderByOccurredAtDesc(eq("USER_BAN"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            auditLogService.list(0, 10, "USER_BAN");

            verify(auditLogRepository).findAllByActionOrderByOccurredAtDesc(eq("USER_BAN"), any(Pageable.class));
            verify(auditLogRepository, never()).findAllByOrderByOccurredAtDesc(any());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Ghi nhật ký (log)")
    class LogMethods {

        @Test
        @DisplayName("logReportProcessed: report null → return, không save")
        void logReportProcessed_nullReport_shouldNoop() {
            auditLogService.logReportProcessed(user(9L), null, true);
            verify(auditLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("logUserBan: payload có previousStatus/newStatus, actorType ADMIN")
        void logUserBan_shouldSaveRow() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"ok\":true}");

            auditLogService.logUserBan(user(9L), 1L, "ACTIVE");

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            AuditLog saved = cap.getValue();
            assertEquals(AuditLogService.ACTOR_ADMIN, saved.getActorType());
            assertEquals(AuditLogService.ACTION_USER_BAN, saved.getAction());
            assertEquals("USER", saved.getEntityType());
            assertEquals(1L, saved.getEntityId());
            assertEquals("{\"ok\":true}", saved.getPayloadJson());
            assertNotNull(saved.getOccurredAt());
            assertEquals(9L, saved.getActor().getId());
        }

        @Test
        @DisplayName("logAdminCommentDelete: listingId null → payload listingId=0")
        void logAdminCommentDelete_nullListingId_shouldDefault() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"listingId\":0}");

            auditLogService.logAdminCommentDelete(user(9L), 7L, null);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            assertEquals(AuditLogService.ACTION_COMMENT_DELETE_ADMIN, cap.getValue().getAction());
            assertEquals("COMMENT", cap.getValue().getEntityType());
            assertEquals(7L, cap.getValue().getEntityId());
            assertEquals("{\"listingId\":0}", cap.getValue().getPayloadJson());
        }

        @Test
        @DisplayName("logReportProcessed: approved=true/false → action APPROVE/REJECT")
        void logReportProcessed_shouldChooseAction() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"reportId\":1}");
            Report report = new Report();
            report.setId(1L);
            report.setTargetType("LISTING");
            report.setTargetId(10L);

            auditLogService.logReportProcessed(user(9L), report, true);
            auditLogService.logReportProcessed(user(9L), report, false);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository, times(2)).save(cap.capture());
            List<AuditLog> saved = cap.getAllValues();
            assertEquals(AuditLogService.ACTION_REPORT_APPROVE, saved.get(0).getAction());
            assertEquals(AuditLogService.ACTION_REPORT_REJECT, saved.get(1).getAction());
        }

        @Test
        @DisplayName("objectMapper serialize lỗi → payloadJson='{}'")
        void log_payloadSerializeFails_shouldFallbackToEmptyJson() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("boom") {});

            auditLogService.logAutoHideListing(10L, 3, 5);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            assertEquals("{}", cap.getValue().getPayloadJson());
        }
    }
}

