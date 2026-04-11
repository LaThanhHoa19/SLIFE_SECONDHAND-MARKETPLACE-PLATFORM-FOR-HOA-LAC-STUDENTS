package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.ReportRequest;
import com.slife.marketplace.dto.response.ReportResponseDTO;
import com.slife.marketplace.entity.Comment;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.Report;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommentRepository;
import com.slife.marketplace.repository.CommunityPostCommentRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.repository.ReportImageRepository;
import com.slife.marketplace.repository.ReportRepository;
import com.slife.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
/**
 * Unit test cho {@link ReportService}.
 *
 * Mục tiêu:
 * - Kiểm tra business rules của report (target hợp lệ, chống duplicate, chống self-report,
 *   chat participant check khi report message).
 * - Kiểm tra các nhánh xử lý của admin: processReport (approve/reject + moderation actions),
 *   auto-hide theo threshold config, và audit log/notification side-effects.
 *
 * Nguyên tắc theo rule:
 * - Không chạm DB: toàn bộ repository/service dependency đều mock.
 * - Mỗi test tập trung 1 nhánh quan trọng và assert đúng {@link ErrorCode} hoặc side-effect chính.
 */
class ReportServiceTest {

    @Mock private ReportRepository reportRepository;
    @Mock private ReportImageRepository reportImageRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private CommunityPostRepository communityPostRepository;
    @Mock private CommunityPostCommentRepository communityPostCommentRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private NotificationService notificationService;
    @Mock private ConfigService configService;
    @Mock private AuditLogService auditLogService;
    @Mock private SystemEmailService systemEmailService;

    @TempDir
    Path tempUploadDir;

    private ReportService service;

    @BeforeEach
    void setUp() {
        service = new ReportService(
                reportRepository,
                reportImageRepository,
                listingRepository,
                userRepository,
                commentRepository,
                communityPostRepository,
                communityPostCommentRepository,
                messageRepository,
                notificationService,
                configService,
                auditLogService,
                systemEmailService,
                tempUploadDir
        );
    }

    private static User user(long id, String role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    private static ReportRequest req(String type, long id) {
        ReportRequest r = new ReportRequest();
        r.setTargetType(type);
        r.setTargetId(id);
        r.setReason("spam");
        return r;
    }

    private void stubReportSaveAssignId() {
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            if (r.getId() == null) r.setId(100L);
            if (r.getCreatedAt() == null) r.setCreatedAt(Instant.now());
            if (r.getUpdatedAt() == null) r.setUpdatedAt(Instant.now());
            return r;
        });
        when(reportImageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("createReport")
    class Create {

        @Test
        @DisplayName("invalid targetType -> REPORT_INVALID_TARGET")
        void invalidTarget_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.createReport(user(1L, "USER"), req("NOPE", 1)));
            assertEquals(ErrorCode.REPORT_INVALID_TARGET, ex.getErrorCode());
        }

        @Test
        @DisplayName("duplicate report -> REPORT_DUPLICATE")
        void duplicate_shouldThrow() {
            when(reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(1L, "LISTING", 10L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.createReport(user(1L, "USER"), req("LISTING", 10)));
            assertEquals(ErrorCode.REPORT_DUPLICATE, ex.getErrorCode());
        }

        @Test
        @DisplayName("alias POST -> LISTING, và self-report listing -> REPORT_SELF")
        void postAlias_selfReport_shouldThrow() {
            User reporter = user(1L, "USER");
            Listing l = new Listing();
            l.setId(10L);
            l.setSeller(reporter);
            when(reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(1L, "LISTING", 10L)).thenReturn(false);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.createReport(reporter, req("POST", 10)));
            assertEquals(ErrorCode.REPORT_SELF, ex.getErrorCode());
        }

        @Test
        @DisplayName("listing happy path + evidence image -> save report + save image + notify + maybe auto-hide")
        void listing_happyPath_evidence_shouldPersistAndNotifyAndAutoHide() {
            stubReportSaveAssignId();
            User reporter = user(1L, "USER");
            User seller = user(2L, "USER");
            Listing l = new Listing();
            l.setId(10L);
            l.setTitle("T");
            l.setSeller(seller);
            l.setStatus("ACTIVE");

            ReportRequest r = req("LISTING", 10);
            r.setEvidenceImage("  http://img  ");

            when(reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(1L, "LISTING", 10L)).thenReturn(false);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));

            // auto-hide threshold reached
            when(configService.getIntConfigValue("AUTO_HIDE_REPORT_THRESHOLD", 3)).thenReturn(3);
            when(reportRepository.countByTargetTypeAndTargetIdAndStatus("LISTING", 10L, "PENDING")).thenReturn(3L);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));

            service.createReport(reporter, r);

            verify(notificationService).notifyListingReported(seller, reporter, 10L, "T");
            verify(reportImageRepository).save(argThat(img -> "http://img".equals(img.getImageUrl())));
            // listing should be auto-hidden (not already HIDDEN)
            verify(listingRepository).save(argThat(x -> "HIDDEN".equalsIgnoreCase(x.getStatus())));
            verify(auditLogService).logAutoHideListing(eq(10L), eq(3), eq(3));
        }

        @Test
        @DisplayName("comment self-report -> REPORT_SELF")
        void comment_self_shouldThrow() {
            User reporter = user(1L, "USER");
            Comment c = new Comment();
            c.setId(5L);
            c.setUser(reporter);
            when(reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(1L, "COMMENT", 5L)).thenReturn(false);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(c));

            SlifeException ex = assertThrows(SlifeException.class, () -> service.createReport(reporter, req("COMMENT", 5)));
            assertEquals(ErrorCode.REPORT_SELF, ex.getErrorCode());
        }

        @Test
        @DisplayName("message: loại MESSAGE không còn trong VALID_TARGET_TYPES -> REPORT_INVALID_TARGET")
        void message_targetTypeUnsupported_shouldThrow() {
            User reporter = user(9L, "USER");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.createReport(reporter, req("MESSAGE", 7)));
            assertEquals(ErrorCode.REPORT_INVALID_TARGET, ex.getErrorCode());
            verifyNoInteractions(messageRepository);
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("getReports/getAdminReports")
    class Queries {
        @Test
        @DisplayName("getReports: normalize type/status + clamp size(1..50)")
        void getReports_normalizeAndClamp() {
            Page<Report> p = new PageImpl<>(List.of(), PageRequest.of(0, 1), 0);
            // Note: service uppercases but does not trim status/type.
            when(reportRepository.findByFilters(eq("LISTING"), eq(" PENDING "), any())).thenReturn(p);

            service.getReports("listing", " pending ", -1, 0);
            verify(reportRepository).findByFilters(eq("LISTING"), eq(" PENDING "), argThat(pr -> pr.getPageSize() == 1));
        }

        @Test
        @DisplayName("getAdminReports: targetType OTHER -> findAdminReportsOther")
        void getAdminReports_other() {
            Page<Report> p = new PageImpl<>(List.of(), PageRequest.of(0, 1), 0);
            when(reportRepository.findAdminReportsOther(eq("PENDING"), any())).thenReturn(p);

            service.getAdminReports("other", "pending", 0, 1, null, null);
            verify(reportRepository).findAdminReportsOther(eq("PENDING"), any());
            verify(reportRepository, never()).findAdminReports(any(), any(), any());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("processReport")
    class Process {

        private Report pendingReport(String type, long targetId) {
            Report r = new Report();
            r.setId(1L);
            r.setTargetType(type);
            r.setTargetId(targetId);
            r.setReason("spam");
            r.setStatus("PENDING");
            r.setCreatedAt(Instant.now());
            r.setUpdatedAt(Instant.now());
            return r;
        }

        @Test
        @DisplayName("action blank/invalid -> INVALID_INPUT")
        void invalidAction_shouldThrow() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, " ", null, user(1L, "ADMIN"))).getErrorCode());
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, "NOPE", null, user(1L, "ADMIN"))).getErrorCode());
        }

        @Test
        @DisplayName("report not found -> REPORT_NOT_FOUND")
        void notFound_shouldThrow() {
            when(reportRepository.findById(1L)).thenReturn(Optional.empty());
            assertEquals(ErrorCode.REPORT_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, "APPROVE", null, user(1L, "ADMIN"))).getErrorCode());
        }

        @Test
        @DisplayName("report status != PENDING -> INVALID_INPUT")
        void notPending_shouldThrow() {
            Report r = pendingReport("LISTING", 10L);
            r.setStatus("RESOLVED");
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, "APPROVE", null, user(1L, "ADMIN"))).getErrorCode());
        }

        @Test
        @DisplayName("APPROVE listing -> close + applyApproveSideEffects (listing status=MOD_HIDDEN) + strike + notify + email + auditLog")
        void approve_listing_shouldHideListingAndAudit() {
            Report r = pendingReport("LISTING", 10L);
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

            User owner = user(2L, "USER");
            owner.setViolationCount(1);
            owner.setTokenRevision(0L);
            Listing l = new Listing();
            l.setId(10L);
            l.setStatus("ACTIVE");
            l.setSeller(owner);
            l.setTitle("Listing title");
            l.setUpdatedAt(Instant.now());
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> inv.getArgument(0));
            when(configService.getIntConfigValue("REPORT_THRESHOLD", 3)).thenReturn(3);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            String msg = service.processReport(1L, "APPROVE", "ok", user(99L, "ADMIN"));
            assertNotNull(msg);
            verify(listingRepository).save(argThat(x -> "MOD_HIDDEN".equalsIgnoreCase(x.getStatus())));
            verify(userRepository).save(argThat(u -> u.getViolationCount() == 2 && !"BANNED".equalsIgnoreCase(u.getStatus())));
            verify(notificationService).notifyAdminHiddenListing(eq(owner), eq(10L), eq("Listing title"), eq(1L), eq("spam"));
            verify(systemEmailService).sendReportApprovedListingModerationEmail(eq(owner), eq(1L), eq("Listing title"),
                    eq(10L), eq(2), eq(3), eq(false), eq("spam"));
            verify(auditLogService).logReportProcessed(any(), any(), eq(true));
        }

        @Test
        @DisplayName("REJECT -> close as rejected + audit log (no approve side effects)")
        void reject_shouldNotApplyApproveSideEffects() {
            Report r = pendingReport("LISTING", 10L);
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

            String msg = service.processReport(1L, "REJECT", "no", user(99L, "ADMIN"));
            assertNotNull(msg);
            verifyNoInteractions(listingRepository);
            verify(auditLogService).logReportProcessed(any(), any(), eq(false));
        }

        @Test
        @DisplayName("HIDE_LISTING_APPROVE: only supports LISTING type")
        void hideListingApprove_wrongType_shouldThrow() {
            Report r = pendingReport("USER", 2L);
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.processReport(1L, "HIDE_LISTING_APPROVE", null, user(1L, "ADMIN")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("BAN_USER_APPROVE: only supports USER type")
        void banUserApprove_wrongType_shouldThrow() {
            Report r = pendingReport("LISTING", 10L);
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.processReport(1L, "BAN_USER_APPROVE", null, user(1L, "ADMIN")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("BAN_USER_APPROVE happy path -> set user BANNED + bump tokenRevision + notify + audit")
        void banUserApprove_shouldBanAndNotify() {
            Report r = pendingReport("USER", 2L);
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

            User target = user(2L, "USER");
            target.setTokenRevision(0L);
            when(userRepository.findById(2L)).thenReturn(Optional.of(target));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            service.processReport(1L, "BAN_USER_APPROVE", null, user(99L, "ADMIN"));

            verify(userRepository).save(argThat(u -> "BANNED".equalsIgnoreCase(u.getStatus()) && u.getTokenRevision() == 1L));
            verify(notificationService).notifyAdminBannedUser(eq(target), eq(1L), eq("spam"));
            verify(auditLogService).logReportProcessed(any(), any(), eq(true));
        }

        @Test
        @DisplayName("APPROVE user dưới ngưỡng ban -> tăng violation + warning notify + email, không ban")
        void approve_user_belowThreshold_shouldWarnNotBan() {
            Report r = pendingReport("USER", 2L);
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

            User target = user(2L, "USER");
            target.setStatus("ACTIVE");
            target.setViolationCount(0);
            target.setTokenRevision(0L);
            when(userRepository.findById(2L)).thenReturn(Optional.of(target));
            when(configService.getIntConfigValue("REPORT_THRESHOLD", 3)).thenReturn(3);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            service.processReport(1L, "APPROVE", "ok", user(99L, "ADMIN"));

            verify(userRepository).save(argThat(u -> u.getViolationCount() == 1 && "ACTIVE".equalsIgnoreCase(u.getStatus())));
            verify(notificationService).notifyReportApprovedUserWarning(eq(target), eq(1L), eq("spam"), eq(1), eq(3));
            verify(notificationService, never()).notifyAdminBannedUser(any(), any(), any());
            verify(systemEmailService).sendReportApprovedUserModerationEmail(eq(target), eq(1L), eq(1), eq(3), eq(false), eq("spam"));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("admin DTO mapping")
    class AdminDto {
        @Test
        @DisplayName("getAdminReportById: not found -> REPORT_NOT_FOUND")
        void getAdminReportById_notFound() {
            when(reportRepository.findById(1L)).thenReturn(Optional.empty());
            assertEquals(ErrorCode.REPORT_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.getAdminReportById(1L)).getErrorCode());
        }

        @Test
        @DisplayName("getAdminReportById: resolve target context for COMMENT image-only")
        void getAdminReportById_commentPreview_imageOnly() {
            Report r = new Report();
            r.setId(1L);
            r.setTargetType("COMMENT");
            r.setTargetId(5L);
            r.setReason("spam");
            r.setStatus("PENDING");
            r.setCreatedAt(Instant.now());
            r.setUpdatedAt(Instant.now());
            r.setReporter(user(9L, "USER"));
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));

            Comment c = new Comment();
            c.setId(5L);
            c.setContent("   ");
            Listing l = new Listing();
            l.setId(10L);
            c.setListing(l);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(c));

            ReportResponseDTO dto = service.getAdminReportById(1L);
            assertEquals("[Image-only comment]", dto.targetPreview());
            assertEquals(10L, dto.listingId());
        }
    }

    @Nested
    @DisplayName("uploadReportEvidenceImage")
    class UploadEvidence {

        @Test
        @DisplayName("file null/empty -> INVALID_INPUT")
        void upload_empty_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadReportEvidenceImage(null));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("invalid extension -> INVALID_FILE_TYPE")
        void upload_invalidExt_shouldThrow() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "evidence.gif", "image/gif", new byte[] {1, 2, 3}
            );
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadReportEvidenceImage(file));
            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
        }
    }
}

