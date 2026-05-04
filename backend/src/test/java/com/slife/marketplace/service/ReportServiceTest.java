package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.ReportRequest;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ReportImageRepository reportImageRepository;
    @Mock
    private ListingRepository listingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private CommunityPostRepository communityPostRepository;
    @Mock
    private CommunityPostCommentRepository communityPostCommentRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ConfigService configService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private SystemEmailService systemEmailService;
    @Mock
    private UserFileStorageService userFileStorage;

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
                userFileStorage
        );
    }

    private static User user(long id, String role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("User " + id);
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

    @Nested
    @DisplayName("Function: createReport")
    class CreateReportGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - invalid targetType")
        void utcId01_shouldThrowInvalidTarget_whenTargetTypeNotSupported() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.createReport(user(1L, "USER"), req("NOPE", 1)));
            assertEquals(ErrorCode.REPORT_INVALID_TARGET, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - duplicate report")
        void utcId02_shouldThrowDuplicate_whenReportAlreadyExists() {
            when(reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(1L, "LISTING", 10L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.createReport(user(1L, "USER"), req("LISTING", 10)));
            assertEquals(ErrorCode.REPORT_DUPLICATE, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - alias POST to LISTING but self-report")
        void utcId03_shouldThrowReportSelf_whenReporterReportsOwnListingViaPostAlias() {
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
        @DisplayName("UTCID04 [Positive] - listing report success with evidence and auto-hide")
        void utcId04_shouldPersistEvidenceNotifyAndAutoHide_whenThresholdReached() {
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
            when(configService.getIntConfigValue("AUTO_HIDE_REPORT_THRESHOLD", 3)).thenReturn(3);
            when(reportRepository.countByTargetTypeAndTargetIdAndStatus("LISTING", 10L, "PENDING")).thenReturn(3L);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));

            service.createReport(reporter, r);

            verify(notificationService).notifyListingReported(seller, reporter, 10L, "T");
            verify(reportImageRepository).save(argThat(img -> "http://img".equals(img.getImageUrl())));
            verify(listingRepository).save(argThat(x -> "HIDDEN".equalsIgnoreCase(x.getStatus())));
            verify(auditLogService).logAutoHideListing(eq(10L), eq(3), eq(3));
        }
    }

    @Nested
    @DisplayName("Function: processReport")
    class ProcessReportGroup {

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
        @DisplayName("UTCID01 [Negative] - action is blank or unsupported")
        void utcId01_shouldThrowInvalidInput_whenActionInvalid() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, " ", null, user(1L, "ADMIN"))).getErrorCode());
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, "NOPE", null, user(1L, "ADMIN"))).getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - report not found")
        void utcId02_shouldThrowReportNotFound_whenReportIdNotExists() {
            when(reportRepository.findById(1L)).thenReturn(Optional.empty());
            assertEquals(ErrorCode.REPORT_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, "APPROVE", null, user(1L, "ADMIN"))).getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - report already processed")
        void utcId03_shouldThrowInvalidInput_whenReportNotPending() {
            Report r = pendingReport("LISTING", 10L);
            r.setStatus("RESOLVED");
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.processReport(1L, "APPROVE", null, user(1L, "ADMIN"))).getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Positive] - APPROVE listing applies moderation side-effects")
        void utcId04_shouldHideListingStrikeOwnerAndAudit_whenApproveListing() {
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
        @DisplayName("UTCID05 [Positive] - REJECT closes report without approve side-effects")
        void utcId05_shouldOnlyAuditWithoutModerationSideEffects_whenReject() {
            Report r = pendingReport("LISTING", 10L);
            when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
            when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

            String msg = service.processReport(1L, "REJECT", "no", user(99L, "ADMIN"));
            assertNotNull(msg);
            verifyNoInteractions(listingRepository);
            verify(auditLogService).logReportProcessed(any(), any(), eq(false));
        }
    }

    @Nested
    @DisplayName("Function: uploadReportEvidenceImage")
    class UploadReportEvidenceImageGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - file is null or empty")
        void utcId01_shouldThrowInvalidInput_whenFileIsNullOrEmpty() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadReportEvidenceImage(null));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());

            MockMultipartFile empty = new MockMultipartFile("f", "a.jpg", "image/jpeg", new byte[0]);
            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> service.uploadReportEvidenceImage(empty));
            assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Boundary] - file exceeds 5MB")
        void utcId02_shouldThrowFileTooLarge_whenFileExceedsMaxSize() {
            byte[] big = new byte[5 * 1024 * 1024 + 1];
            MockMultipartFile file = new MockMultipartFile("file", "evidence.jpg", "image/jpeg", big);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadReportEvidenceImage(file));
            assertEquals(ErrorCode.FILE_TOO_LARGE, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - invalid file extension")
        void utcId03_shouldThrowInvalidFileType_whenExtensionNotAllowed() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "evidence.gif", "image/gif", new byte[] {1, 2, 3}
            );
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadReportEvidenceImage(file));
            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Positive] - valid file is stored and returns URL")
        void utcId04_shouldStoreAndReturnUrl_whenFileIsValid() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "evidence.png", "image/png", new byte[] {1, 2, 3}
            );
            when(userFileStorage.storeMultipart(eq(file), startsWith("reports/report_")))
                    .thenReturn("https://cdn/reports/report_1.png");

            String url = service.uploadReportEvidenceImage(file);

            assertEquals("https://cdn/reports/report_1.png", url);
            verify(userFileStorage).storeMultipart(eq(file), startsWith("reports/report_"));
        }
    }
}

