package com.slife.marketplace.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.response.AuditLogEntryDTO;
import com.slife.marketplace.entity.AuditLog;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
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

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService - UTC theo G130")
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
        return u;
    }

    private static AuditLog row(long id, User actor, String action, Long entityId) {
        AuditLog a = new AuditLog();
        a.setId(id);
        a.setOccurredAt(Instant.parse("2026-01-01T00:00:00Z"));
        a.setActor(actor);
        a.setActorType(actor != null ? AuditLogService.ACTOR_ADMIN : AuditLogService.ACTOR_SYSTEM);
        a.setAction(action);
        a.setEntityType("USER");
        a.setEntityId(entityId);
        a.setPayloadJson("{}");
        return a;
    }

    @Nested
    @DisplayName("Method: list")
    class ListUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [N] lọc USER_BAN: trả đúng danh sách khóa tài khoản")
        void utcid01_filterByUserBanAction() {
            when(auditLogRepository.findAllByActionOrderByOccurredAtDesc(eq(AuditLogService.ACTION_USER_BAN), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(
                            row(2L, user(9L), AuditLogService.ACTION_USER_BAN, 2L),
                            row(1L, user(9L), AuditLogService.ACTION_USER_BAN, 1L)
                    )));

            Page<AuditLogEntryDTO> out = auditLogService.list(0, 20, AuditLogService.ACTION_USER_BAN);

            assertEquals(2, out.getTotalElements());
            assertEquals(AuditLogService.ACTION_USER_BAN, out.getContent().get(0).action());
            verify(auditLogRepository).findAllByActionOrderByOccurredAtDesc(eq(AuditLogService.ACTION_USER_BAN), any(Pageable.class));
            verify(auditLogRepository, never()).findAllByOrderByOccurredAtDesc(any());
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID02 [N] action trống: hiển thị toàn bộ nhật ký")
        void utcid02_listAllWhenActionBlank() {
            when(auditLogRepository.findAllByOrderByOccurredAtDesc(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(
                            row(3L, user(9L), AuditLogService.ACTION_USER_BAN, 3L),
                            row(2L, null, AuditLogService.ACTION_AUTO_HIDE_LISTING, 10L)
                    )));

            Page<AuditLogEntryDTO> out = auditLogService.list(0, 20, "   ");

            assertEquals(2, out.getTotalElements());
            verify(auditLogRepository).findAllByOrderByOccurredAtDesc(any(Pageable.class));
            verify(auditLogRepository, never()).findAllByActionOrderByOccurredAtDesc(any(), any(Pageable.class));
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID03 [B] page=-1, size=999: normalize page=0, size=100")
        void utcid03_invalidPagingGetsNormalized() {
            when(auditLogRepository.findAllByOrderByOccurredAtDesc(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            auditLogService.list(-1, 999, null);

            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(auditLogRepository).findAllByOrderByOccurredAtDesc(cap.capture());
            assertEquals(0, cap.getValue().getPageNumber());
            assertEquals(100, cap.getValue().getPageSize());
        }
    }

    @Nested
    @DisplayName("Method: logUserBan & logAutoHideListing")
    class LogActionUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [N] Admin ban user: log có actor Admin và previousStatus")
        void utcid01_logUserBanByAdmin() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"previousStatus\":\"ACTIVE\",\"newStatus\":\"BANNED\"}");

            auditLogService.logUserBan(user(9L), 1L, "ACTIVE");

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            AuditLog saved = cap.getValue();
            assertEquals(AuditLogService.ACTOR_ADMIN, saved.getActorType());
            assertEquals(AuditLogService.ACTION_USER_BAN, saved.getAction());
            assertEquals(1L, saved.getEntityId());
            assertEquals(9L, saved.getActor().getId());
            assertEquals("{\"previousStatus\":\"ACTIVE\",\"newStatus\":\"BANNED\"}", saved.getPayloadJson());
            assertNotNull(saved.getOccurredAt());
        }

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [N] System auto-hide listing: actorType=SYSTEM và đúng listingId")
        void utcid02_logAutoHideBySystem() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"pendingReportCount\":8,\"threshold\":5}");

            auditLogService.logAutoHideListing(10L, 8, 5);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            AuditLog saved = cap.getValue();
            assertEquals(AuditLogService.ACTOR_SYSTEM, saved.getActorType());
            assertEquals(AuditLogService.ACTION_AUTO_HIDE_LISTING, saved.getAction());
            assertEquals("LISTING", saved.getEntityType());
            assertEquals(10L, saved.getEntityId());
        }
    }

    @Nested
    @DisplayName("Method: private log fault tolerance")
    class LogInternalUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [A] lỗi JSON: nghiệp vụ vẫn chạy, payload fallback {}")
        void utcid01_jsonSerializeErrorFallback() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("boom") {});

            assertDoesNotThrow(() -> auditLogService.logUserBan(user(9L), 1L, "ACTIVE"));

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            assertEquals("{}", cap.getValue().getPayloadJson());
            assertEquals(AuditLogService.ACTION_USER_BAN, cap.getValue().getAction());
        }
    }
}
