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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Ma trận UTC — {@link AuditLogService}. Mỗi {@link Nested} = một tab (theo method có test).
 * <p>
 * Chưa có UTC trong file này cho: {@link AuditLogService#logUserUnban(User, Long, String)},
 * {@link AuditLogService#logAutoHideComment(Long, int, int)}.
 * <p>
 * Tóm tắt:
 * <pre>
 * Mã         | Tab | Method                 | Loại | Ghi chú ngắn
 * -----------|-----|------------------------|------|------------------
 * UTC-AUD-01 |  1  | list                   | B    | action blank; page/size normalize
 * UTC-AUD-02 |  1  | list                   | N    | action USER_BAN → findByAction
 * UTC-AUD-03 |  2  | logUserBan             | N    | save row ADMIN, payload JSON
 * UTC-AUD-04 |  3  | logAdminCommentDelete  | B    | listingId null → payload 0
 * UTC-AUD-05 |  4  | logReportProcessed     | A    | report null → noop
 * UTC-AUD-06 |  4  | logReportProcessed     | N    | approved=true → REPORT_APPROVE
 * UTC-AUD-07 |  4  | logReportProcessed     | N    | approved=false → REPORT_REJECT
 * UTC-AUD-08 |  5  | logAutoHideListing     | A    | ObjectMapper lỗi → payload "{}"
 * </pre>
 * Loại: N = Normal, A = Abnormal, B = Boundary.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService — ma trận UTC (5 tab)")
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

    /**
     * <h2>Tab 1 — {@link AuditLogService#list(int, int, String)}</h2>
     *
     * <h3>UTC-AUD-01 [B]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Stub {@code findAllByOrderByOccurredAtDesc} trả {@link Page} 1 dòng.</dd>
     *   <dt>Input</dt><dd>{@code page=-1}, {@code size=0}, {@code action="   "} (blank).</dd>
     *   <dt>Return</dt><dd>Page DTO {@code totalElements=1}.</dd>
     *   <dt>Confirm</dt><dd>Pageable: page 0, size 20; gọi {@code findAllByOrderByOccurredAtDesc}, không gọi {@code findAllByAction...}.</dd>
     * </dl>
     *
     * <h3>UTC-AUD-02 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Stub {@code findAllByActionOrderByOccurredAtDesc("USER_BAN",·)} trả page rỗng.</dd>
     *   <dt>Input</dt><dd>{@code action="USER_BAN"}, page/size hợp lệ.</dd>
     *   <dt>Confirm</dt><dd>Chỉ gọi {@code findAllByActionOrderByOccurredAtDesc}; không gọi findAll.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 1 · list")
    class ListLogs {

        /**
         * UTC-AUD-01 — xem {@link ListLogs} (Tab 1).
         */
        @Test
        @Tag("UTC-AUD-01")
        @DisplayName("UTC-AUD-01 [B] action null/blank → findAll; page âm → 0; size ≤0 → 20")
        void utcAud01_listWithoutActionNormalizesPaging() {
            when(auditLogRepository.findAllByOrderByOccurredAtDesc(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(row(1L, user(9L), "X", "USER", 1L, "{}"))));

            Page<AuditLogEntryDTO> out = auditLogService.list(-1, 0, "   ");

            assertEquals(1, out.getTotalElements());
            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(auditLogRepository).findAllByOrderByOccurredAtDesc(cap.capture());
            assertEquals(0, cap.getValue().getPageNumber());
            assertEquals(20, cap.getValue().getPageSize());
        }

        /**
         * UTC-AUD-02 — xem {@link ListLogs} (Tab 1).
         */
        @Test
        @Tag("UTC-AUD-02")
        @DisplayName("UTC-AUD-02 [N] action có giá trị → findAllByActionOrderByOccurredAtDesc")
        void utcAud02_listWithActionFilter() {
            when(auditLogRepository.findAllByActionOrderByOccurredAtDesc(eq("USER_BAN"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            auditLogService.list(0, 10, "USER_BAN");

            verify(auditLogRepository).findAllByActionOrderByOccurredAtDesc(eq("USER_BAN"), any(Pageable.class));
            verify(auditLogRepository, never()).findAllByOrderByOccurredAtDesc(any());
        }
    }

    /**
     * <h2>Tab 2 — {@link AuditLogService#logUserBan(User, Long, String)}</h2>
     * <h3>UTC-AUD-03 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>{@code objectMapper.writeValueAsString} trả {@code "{\"ok\":true}"}.</dd>
     *   <dt>Input</dt><dd>admin id 9, {@code targetUserId=1L}, {@code previousStatus="ACTIVE"}.</dd>
     *   <dt>Confirm</dt><dd>{@code save} một {@link AuditLog}: {@code ACTOR_ADMIN}, {@code ACTION_USER_BAN}, entity USER/1L, payload JSON như stub, {@code occurredAt} non-null.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 2 · logUserBan")
    class LogUserBan {

        /**
         * UTC-AUD-03 — xem {@link LogUserBan} (Tab 2).
         */
        @Test
        @Tag("UTC-AUD-03")
        @DisplayName("UTC-AUD-03 [N] logUserBan: payload + actorType ADMIN + save")
        void utcAud03_logUserBanSavesRow() throws Exception {
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
    }

    /**
     * <h2>Tab 3 — {@link AuditLogService#logAdminCommentDelete(User, Long, Long)}</h2>
     * <h3>UTC-AUD-04 [B]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>ObjectMapper trả JSON có {@code listingId:0}.</dd>
     *   <dt>Input</dt><dd>{@code listingId=null}, {@code commentId=7L}.</dd>
     *   <dt>Confirm</dt><dd>Action {@code COMMENT_DELETE_ADMIN}, entity COMMENT / 7, payload chứa listingId 0.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 3 · logAdminCommentDelete")
    class LogAdminCommentDelete {

        /**
         * UTC-AUD-04 — xem {@link LogAdminCommentDelete} (Tab 3).
         */
        @Test
        @Tag("UTC-AUD-04")
        @DisplayName("UTC-AUD-04 [B] listingId null → payload listingId=0")
        void utcAud04_nullListingIdDefaultsInPayload() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"listingId\":0}");

            auditLogService.logAdminCommentDelete(user(9L), 7L, null);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            assertEquals(AuditLogService.ACTION_COMMENT_DELETE_ADMIN, cap.getValue().getAction());
            assertEquals("COMMENT", cap.getValue().getEntityType());
            assertEquals(7L, cap.getValue().getEntityId());
            assertEquals("{\"listingId\":0}", cap.getValue().getPayloadJson());
        }
    }

    /**
     * <h2>Tab 4 — {@link AuditLogService#logReportProcessed(User, Report, boolean)}</h2>
     *
     * <h3>UTC-AUD-05 [A]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Không cần stub repo.</dd>
     *   <dt>Input</dt><dd>{@code report=null}.</dd>
     *   <dt>Confirm</dt><dd>Không {@code save}.</dd>
     * </dl>
     *
     * <h3>UTC-AUD-06 [N]</h3>
     * <dl>
     *   <dt>Input</dt><dd>Report id 1, {@code approved=true}.</dd>
     *   <dt>Confirm</dt><dd>Một dòng save với {@code ACTION_REPORT_APPROVE}, entity REPORT.</dd>
     * </dl>
     *
     * <h3>UTC-AUD-07 [N]</h3>
     * <dl>
     *   <dt>Input</dt><dd>Cùng report, {@code approved=false}.</dd>
     *   <dt>Confirm</dt><dd>Một dòng save với {@code ACTION_REPORT_REJECT}.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 4 · logReportProcessed")
    class LogReportProcessed {

        private static Report report1() {
            Report report = new Report();
            report.setId(1L);
            report.setTargetType("LISTING");
            report.setTargetId(10L);
            return report;
        }

        /**
         * UTC-AUD-05 — xem {@link LogReportProcessed} (Tab 4).
         */
        @Test
        @Tag("UTC-AUD-05")
        @DisplayName("UTC-AUD-05 [A] report null → return, không save")
        void utcAud05_nullReportNoop() {
            auditLogService.logReportProcessed(user(9L), null, true);
            verify(auditLogRepository, never()).save(any());
        }

        /**
         * UTC-AUD-06 — xem {@link LogReportProcessed} (Tab 4).
         */
        @Test
        @Tag("UTC-AUD-06")
        @DisplayName("UTC-AUD-06 [N] approved=true → ACTION_REPORT_APPROVE")
        void utcAud06_reportApproved() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"reportId\":1}");
            Report report = report1();

            auditLogService.logReportProcessed(user(9L), report, true);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            assertEquals(AuditLogService.ACTION_REPORT_APPROVE, cap.getValue().getAction());
            assertEquals("REPORT", cap.getValue().getEntityType());
            assertEquals(1L, cap.getValue().getEntityId());
        }

        /**
         * UTC-AUD-07 — xem {@link LogReportProcessed} (Tab 4).
         */
        @Test
        @Tag("UTC-AUD-07")
        @DisplayName("UTC-AUD-07 [N] approved=false → ACTION_REPORT_REJECT")
        void utcAud07_reportRejected() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"reportId\":1}");
            Report report = report1();

            auditLogService.logReportProcessed(user(9L), report, false);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            assertEquals(AuditLogService.ACTION_REPORT_REJECT, cap.getValue().getAction());
        }
    }

    /**
     * <h2>Tab 5 — {@link AuditLogService#logAutoHideListing(Long, int, int)}</h2>
     * <h3>UTC-AUD-08 [A]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>{@code objectMapper.writeValueAsString} ném {@link JsonProcessingException}.</dd>
     *   <dt>Input</dt><dd>{@code listingId=10L}, {@code pendingReportCount=3}, {@code threshold=5}.</dd>
     *   <dt>Confirm</dt><dd>Vẫn {@code save}; {@code payloadJson="{}"}; actor null / {@code ACTOR_SYSTEM}.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 5 · logAutoHideListing")
    class LogAutoHideListing {

        /**
         * UTC-AUD-08 — xem {@link LogAutoHideListing} (Tab 5).
         */
        @Test
        @Tag("UTC-AUD-08")
        @DisplayName("UTC-AUD-08 [A] serialize payload lỗi → payloadJson='{}'")
        void utcAud08_payloadSerializeFailsFallback() throws Exception {
            when(objectMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("boom") {});

            auditLogService.logAutoHideListing(10L, 3, 5);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(cap.capture());
            assertEquals("{}", cap.getValue().getPayloadJson());
            assertEquals(AuditLogService.ACTOR_SYSTEM, cap.getValue().getActorType());
            assertEquals(AuditLogService.ACTION_AUTO_HIDE_LISTING, cap.getValue().getAction());
        }
    }
}
