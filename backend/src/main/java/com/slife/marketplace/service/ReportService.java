/**
 * Mục đích: Service ReportService
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.ReportRequest;
import com.slife.marketplace.dto.request.ResolveReportRequest;
import com.slife.marketplace.dto.response.ReportResponse;
import com.slife.marketplace.dto.response.ReportResponseDTO;
import com.slife.marketplace.entity.Comment;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.Message;
import com.slife.marketplace.entity.Report;
import com.slife.marketplace.entity.ReportImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommentRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.repository.ReportImageRepository;
import com.slife.marketplace.repository.ReportRepository;
import com.slife.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);
    private static final Set<String> VALID_TARGET_TYPES = Set.of("LISTING", "POST", "USER", "COMMENT", "MESSAGE");
    private static final Set<String> VALID_RESOLVE_STATUSES = Set.of("RESOLVED", "REJECTED", "DISMISSED");
    private static final Set<String> VALID_MODERATION_ACTIONS = Set.of("HIDE_LISTING_APPROVE", "BAN_USER_APPROVE");
    private static final int DEFAULT_REPORT_THRESHOLD = 3;
    private static final int DEFAULT_AUTO_HIDE_THRESHOLD = 3;

    private final ReportRepository reportRepository;
    private final ReportImageRepository reportImageRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final MessageRepository messageRepository;
    private final NotificationService notificationService;
    private final ConfigService configService;
    private final AuditLogService auditLogService;

    public ReportService(ReportRepository reportRepository,
                         ReportImageRepository reportImageRepository,
                         ListingRepository listingRepository,
                         UserRepository userRepository,
                         CommentRepository commentRepository,
                         MessageRepository messageRepository,
                         NotificationService notificationService,
                         ConfigService configService,
                         AuditLogService auditLogService) {
        this.reportRepository = reportRepository;
        this.reportImageRepository = reportImageRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.messageRepository = messageRepository;
        this.notificationService = notificationService;
        this.configService = configService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public ReportResponse createReport(User reporter, ReportRequest request) {
        String rawTargetType = request.getTargetType() != null ? request.getTargetType().trim().toUpperCase(Locale.ROOT) : "";
        if (!VALID_TARGET_TYPES.contains(rawTargetType)) {
            throw new SlifeException(ErrorCode.REPORT_INVALID_TARGET);
        }
        // Alias: POST is the same as LISTING in our schema.
        String targetType = "POST".equals(rawTargetType) ? "LISTING" : rawTargetType;

        if (reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(
                reporter.getId(), targetType, request.getTargetId())) {
            throw new SlifeException(ErrorCode.REPORT_DUPLICATE);
        }

        return switch (targetType) {
            case "LISTING" -> createListingReport(reporter, request, targetType);
            case "USER" -> createUserReport(reporter, request, targetType);
            case "COMMENT" -> createCommentReport(reporter, request, targetType);
            case "MESSAGE" -> createMessageReport(reporter, request, targetType);
            default -> throw new SlifeException(ErrorCode.REPORT_INVALID_TARGET);
        };
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getReports(String targetType, String status, int page, int size) {
        String normalizedType = (targetType != null && !targetType.isBlank()) ? targetType.toUpperCase() : null;
        String normalizedStatus = (status != null && !status.isBlank()) ? status.toUpperCase() : null;

        Page<Report> reports = reportRepository.findByFilters(
                normalizedType, normalizedStatus, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));

        return reports.map(ReportResponse::from);
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDTO> getPendingReports() {
        return reportRepository.findPendingReportsWithReporter()
                .stream()
                .map(this::toReportResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDTO> getAdminReports(String targetType, String status, int page, int size,
                                                   String sortBy, String sortDir) {
        String normalizedTargetType = (targetType != null && !targetType.isBlank())
                ? targetType.trim().toUpperCase(Locale.ROOT)
                : null;
        if ("POST".equals(normalizedTargetType)) normalizedTargetType = "LISTING";
        String normalizedStatus = (status != null && !status.isBlank())
                ? status.trim().toUpperCase(Locale.ROOT)
                : null;

        String resolvedSortBy = resolveSortBy(sortBy);
        Sort.Direction dir = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(dir, resolvedSortBy)
        );

        if ("OTHER".equals(normalizedTargetType)) {
            return reportRepository.findAdminReportsOther(normalizedStatus, pageable)
                    .map(this::toReportResponseDTO);
        }
        return reportRepository.findAdminReports(normalizedTargetType, normalizedStatus, pageable)
                .map(this::toReportResponseDTO);
    }

    @Transactional(readOnly = true)
    public ReportResponseDTO getAdminReportById(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new SlifeException(ErrorCode.REPORT_NOT_FOUND));
        if (report.getReporter() != null) {
            report.getReporter().getFullName();
            report.getReporter().getAvatarUrl();
        }
        return toReportResponseDTO(report);
    }

    @Transactional
    public ReportResponse resolveReport(Long reportId, User admin, ResolveReportRequest request) {
        String resolveStatus = request.getStatus().toUpperCase(Locale.ROOT);
        if ("DISMISSED".equals(resolveStatus)) {
            resolveStatus = "REJECTED";
        }
        if (!VALID_RESOLVE_STATUSES.contains(resolveStatus)) {
            throw new SlifeException(ErrorCode.REPORT_INVALID_STATUS);
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new SlifeException(ErrorCode.REPORT_NOT_FOUND));

        ensurePendingBeforeProcess(report);

        report.setStatus(resolveStatus);
        report.setAdminNote(request.getAdminNote());
        report.setHandledBy(admin);
        report.setUpdatedAt(Instant.now());

        Report saved = reportRepository.save(report);
        log.info("Report id={} resolved as {} by admin={}", reportId, resolveStatus, admin.getId());
        boolean approved = "RESOLVED".equals(resolveStatus);
        auditLogService.logReportProcessed(admin, saved, approved);
        return ReportResponse.from(saved);
    }

    @Transactional
    public String processReport(Long reportId, String action, String note, User admin) {
        String normalizedAction = normalizeAction(action);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new SlifeException(ErrorCode.REPORT_NOT_FOUND));

        ensurePendingBeforeProcess(report);

        if ("HIDE_LISTING_APPROVE".equals(normalizedAction)) {
            if (!"LISTING".equalsIgnoreCase(String.valueOf(report.getTargetType()))) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "HIDE_LISTING_APPROVE only supports LISTING reports");
            }
            hideListingByAdmin(report.getTargetId());
            return closeReportAfterModeration(report, admin, note, true);
        }

        if ("BAN_USER_APPROVE".equals(normalizedAction)) {
            if (!"USER".equalsIgnoreCase(String.valueOf(report.getTargetType()))) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "BAN_USER_APPROVE only supports USER reports");
            }
            banUserByAdmin(report.getTargetId());
            return closeReportAfterModeration(report, admin, note, true);
        }

        if ("APPROVE".equals(normalizedAction)) {
            return closeReportAfterModeration(report, admin, note, true);
        }

        return closeReportAfterModeration(report, admin, note, false);
    }

    private ReportResponse createListingReport(User reporter, ReportRequest request, String targetType) {
        Listing listing = listingRepository.findById(request.getTargetId())
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (listing.getSeller().getId().equals(reporter.getId())) {
            throw new SlifeException(ErrorCode.REPORT_SELF);
        }

        Report report = buildReport(reporter, targetType, request);
        Report saved = persistReportWithEvidence(report, request.getEvidenceImage());

        notificationService.notifyListingReported(listing.getSeller(), reporter, listing.getId(), listing.getTitle());
        log.info("Listing report created: reportId={} listingId={} by userId={}", saved.getId(), listing.getId(), reporter.getId());

        maybeAutoHideAfterReport("LISTING", listing.getId());
        return ReportResponse.from(saved);
    }

    private ReportResponse createUserReport(User reporter, ReportRequest request, String targetType) {
        User targetUser = userRepository.findById(request.getTargetId())
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        if (targetUser.getId().equals(reporter.getId())) {
            throw new SlifeException(ErrorCode.REPORT_SELF);
        }

        Report report = buildReport(reporter, targetType, request);
        Report saved = persistReportWithEvidence(report, request.getEvidenceImage());

        log.info("User report created: reportId={} targetUserId={} by userId={}", saved.getId(), targetUser.getId(), reporter.getId());
        return ReportResponse.from(saved);
    }

    private ReportResponse createCommentReport(User reporter, ReportRequest request, String targetType) {
        Comment comment = commentRepository.findById(request.getTargetId())
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMENT_NOT_FOUND));
        if (comment.getUser() != null && comment.getUser().getId() != null
                && comment.getUser().getId().equals(reporter.getId())) {
            throw new SlifeException(ErrorCode.REPORT_SELF);
        }
        Report report = buildReport(reporter, targetType, request);
        Report saved = persistReportWithEvidence(report, request.getEvidenceImage());
        Long listingId = comment.getListing() != null ? comment.getListing().getId() : null;
        log.info("Comment report created: reportId={} commentId={} listingId={} by userId={}",
                saved.getId(), comment.getId(), listingId, reporter.getId());
        return ReportResponse.from(saved);
    }

    private ReportResponse createMessageReport(User reporter, ReportRequest request, String targetType) {
        Message message = messageRepository.findById(request.getTargetId())
                .orElseThrow(() -> new SlifeException(ErrorCode.MESSAGE_NOT_FOUND));

        // Only conversation participants can report a message.
        if (!isConversationParticipant(message.getConversation(), reporter)) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
        }
        if (message.getSender() != null && message.getSender().getId() != null
                && message.getSender().getId().equals(reporter.getId())) {
            throw new SlifeException(ErrorCode.REPORT_SELF);
        }

        Report report = buildReport(reporter, targetType, request);
        Report saved = persistReportWithEvidence(report, request.getEvidenceImage());
        Long convId = message.getConversation() != null ? message.getConversation().getId() : null;
        log.info("Message report created: reportId={} messageId={} conversationId={} by userId={}",
                saved.getId(), message.getId(), convId, reporter.getId());
        return ReportResponse.from(saved);
    }

    private Report buildReport(User reporter, String targetType, ReportRequest request) {
        Report report = new Report();
        report.setReporter(reporter);
        report.setTargetType(targetType);
        report.setTargetId(request.getTargetId());
        report.setReason(request.getReason());
        report.setStatus("PENDING");
        report.setCreatedAt(Instant.now());
        report.setUpdatedAt(Instant.now());
        return report;
    }

    private Report persistReportWithEvidence(Report report, String evidenceImage) {
        Report saved = reportRepository.save(report);
        if (evidenceImage != null && !evidenceImage.isBlank()) {
            ReportImage img = new ReportImage();
            img.setReport(saved);
            img.setImageUrl(evidenceImage.trim());
            img.setCreatedAt(Instant.now());
            img.setUpdatedAt(Instant.now());
            reportImageRepository.save(img);
        }
        return saved;
    }

    private boolean isConversationParticipant(com.slife.marketplace.entity.Conversation conv, User user) {
        if (conv == null || user == null) return false;
        Long uid = user.getId();
        if (uid == null) return false;
        try {
            if (conv.getUserId1() != null && uid.equals(conv.getUserId1().getId())) return true;
            if (conv.getUserId2() != null && uid.equals(conv.getUserId2().getId())) return true;
            if (conv.getListing() != null && conv.getListing().getSeller() != null && uid.equals(conv.getListing().getSeller().getId())) return true;
        } catch (Exception ignored) {
            // defensive: lazy loading edge
        }
        // Email-based fallback (for some legacy paths)
        String ue = user.getEmail() != null ? user.getEmail().trim().toLowerCase(Locale.ROOT) : "";
        if (!ue.isBlank()) {
            String e1 = conv.getUserId1() != null && conv.getUserId1().getEmail() != null ? conv.getUserId1().getEmail().trim().toLowerCase(Locale.ROOT) : "";
            String e2 = conv.getUserId2() != null && conv.getUserId2().getEmail() != null ? conv.getUserId2().getEmail().trim().toLowerCase(Locale.ROOT) : "";
            if (!e1.isBlank() && e1.equals(ue)) return true;
            return !e2.isBlank() && e2.equals(ue);
        }
        return false;
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "action is required");
        }
        String normalized = action.trim().toUpperCase(Locale.ROOT);
        if (!"APPROVE".equals(normalized) && !"REJECT".equals(normalized) && !VALID_MODERATION_ACTIONS.contains(normalized)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT,
                    "action must be APPROVE, REJECT, HIDE_LISTING_APPROVE, or BAN_USER_APPROVE");
        }
        return normalized;
    }

    private void ensurePendingBeforeProcess(Report report) {
        String status = report.getStatus() != null ? report.getStatus().trim().toUpperCase(Locale.ROOT) : "";
        if (!"PENDING".equals(status)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Report has already been processed");
        }
    }

    private String closeReportAfterModeration(Report report, User admin, String note, boolean approved) {
        report.setAdminNote(note);
        report.setHandledBy(admin);
        report.setUpdatedAt(Instant.now());
        report.setStatus(approved ? "RESOLVED" : "REJECTED");

        Report savedReport = reportRepository.save(report);
        if (approved) {
            applyApproveSideEffects(savedReport);
        }
        auditLogService.logReportProcessed(admin, savedReport, approved);
        return "Report processed successfully";
    }

    private void hideListingByAdmin(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        listing.setStatus("MOD_HIDDEN");
        listing.setUpdatedAt(Instant.now());
        listingRepository.save(listing);

        User owner = listing.getSeller();
        if (owner != null) {
            notificationService.notifyAdminHiddenListing(owner, listing.getId(), listing.getTitle());
        }
    }

    private void banUserByAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
        user.setStatus("BANNED");
        bumpTokenRevision(user);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        notificationService.notifyAdminBannedUser(user);
    }

    private void applyApproveSideEffects(Report report) {
        if ("LISTING".equals(report.getTargetType())) {
            Listing listing = listingRepository.findById(report.getTargetId())
                    .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
            listing.setStatus("HIDDEN");
            listing.setUpdatedAt(Instant.now());
            listingRepository.save(listing);
            return;
        }

        if ("COMMENT".equals(report.getTargetType())) {
            Comment comment = commentRepository.findById(report.getTargetId())
                    .orElseThrow(() -> new SlifeException(ErrorCode.COMMENT_NOT_FOUND));
            if (comment.getHiddenAt() == null) {
                comment.setHiddenAt(Instant.now());
                comment.setUpdatedAt(Instant.now());
                commentRepository.save(comment);
            }
            return;
        }

        if ("USER".equals(report.getTargetType())) {
            User user = userRepository.findById(report.getTargetId())
                    .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
            long approvedCount = reportRepository.countByTargetTypeAndTargetIdAndStatus("USER", user.getId(), "RESOLVED");
            int reportThreshold = Math.max(1, configService.getIntConfigValue("REPORT_THRESHOLD", DEFAULT_REPORT_THRESHOLD));
            if (approvedCount >= reportThreshold) {
                user.setStatus("BANNED");
                bumpTokenRevision(user);
                user.setUpdatedAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                log.warn("User auto-banned due to approved reports. userId={}, approvedReports={}, threshold={}",
                        user.getId(), approvedCount, reportThreshold);
            }
        }
    }

    private ReportResponseDTO toReportResponseDTO(Report report) {
        String reporterName = report.getReporter() != null ? report.getReporter().getFullName() : null;
        String reporterAvatarUrl = report.getReporter() != null ? report.getReporter().getAvatarUrl() : null;
        TargetContext ctx = resolveTargetContext(report);
        return new ReportResponseDTO(
                report.getId(),
                reporterName,
                reporterAvatarUrl,
                ctx.reportedUserAvatarUrl(),
                report.getTargetType(),
                report.getTargetId(),
                ctx.preview(),
                ctx.listingId(),
                ctx.conversationId(),
                report.getReason(),
                report.getStatus(),
                report.getAdminNote(),
                report.getCreatedAt());
    }

    private TargetContext resolveTargetContext(Report report) {
        String targetType = report.getTargetType() != null ? report.getTargetType().toUpperCase(Locale.ROOT) : "";
        Long targetId = report.getTargetId();
        if (targetId == null) return new TargetContext(null, null, null, null);
        try {
            if ("LISTING".equals(targetType)) {
                return listingRepository.findById(targetId)
                        .map(l -> new TargetContext(truncate(l.getTitle(), 120), l.getId(), null, null))
                        .orElse(new TargetContext("[Listing not found]", null, null, null));
            }
            if ("COMMENT".equals(targetType)) {
                return commentRepository.findById(targetId)
                        .map(c -> {
                            Long listingId = c.getListing() != null ? c.getListing().getId() : null;
                            String preview = (c.getContent() == null || c.getContent().isBlank())
                                    ? "[Image-only comment]"
                                    : truncate(c.getContent(), 120);
                            return new TargetContext(preview, listingId, null, null);
                        })
                        .orElse(new TargetContext("[Comment not found]", null, null, null));
            }
            if ("MESSAGE".equals(targetType)) {
                return messageRepository.findById(targetId)
                        .map(m -> {
                            Long convId = m.getConversation() != null ? m.getConversation().getId() : null;
                            Long listingId = (m.getConversation() != null && m.getConversation().getListing() != null)
                                    ? m.getConversation().getListing().getId()
                                    : null;
                            String preview;
                            if (m.getMessageType() != null && m.getMessageType().name().equals("IMAGE")) {
                                preview = "[Image message]";
                            } else {
                                preview = truncate(m.getContent(), 120);
                            }
                            return new TargetContext(preview, listingId, convId, null);
                        })
                        .orElse(new TargetContext("[Message not found]", null, null, null));
            }
            if ("USER".equals(targetType)) {
                return userRepository.findById(targetId)
                        .map(u -> new TargetContext(u.getFullName(), null, null, u.getAvatarUrl()))
                        .orElse(new TargetContext("[User not found]", null, null, null));
            }
        } catch (Exception ex) {
            log.warn("resolveTargetContext failed reportId={} type={} targetId={}: {}",
                    report.getId(), targetType, targetId, ex.getMessage());
        }
        return new TargetContext(null, null, null, null);
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private String resolveSortBy(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) return "createdAt";
        return switch (sortBy.trim()) {
            case "reportId", "id" -> "id";
            case "status" -> "status";
            case "targetType" -> "targetType";
            case "updatedAt" -> "updatedAt";
            case "createdAt" -> "createdAt";
            default -> "createdAt";
        };
    }

    private record TargetContext(String preview, Long listingId, Long conversationId, String reportedUserAvatarUrl) {}

    /**
     * When PENDING reports for the same target reach the configured threshold, hide listing or comment.
     */
    private void maybeAutoHideAfterReport(String targetType, Long targetId) {
        int threshold = Math.max(1, configService.getIntConfigValue("AUTO_HIDE_REPORT_THRESHOLD", DEFAULT_AUTO_HIDE_THRESHOLD));
        long pending = reportRepository.countByTargetTypeAndTargetIdAndStatus(targetType, targetId, "PENDING");
        if (pending < threshold) {
            return;
        }
        if ("LISTING".equals(targetType)) {
            listingRepository.findById(targetId).ifPresent(listing -> {
                if (listing.getStatus() != null && "HIDDEN".equalsIgnoreCase(listing.getStatus().trim())) {
                    return;
                }
                listing.setStatus("HIDDEN");
                listing.setUpdatedAt(Instant.now());
                listingRepository.save(listing);
                auditLogService.logAutoHideListing(targetId, (int) pending, threshold);
                log.warn("Listing auto-hidden by report count. listingId={}, pendingReports={}, threshold={}",
                        targetId, pending, threshold);
            });
            return;
        }
        if ("COMMENT".equals(targetType)) {
            commentRepository.findById(targetId).ifPresent(comment -> {
                if (comment.getHiddenAt() != null) {
                    return;
                }
                comment.setHiddenAt(Instant.now());
                comment.setUpdatedAt(Instant.now());
                commentRepository.save(comment);
                auditLogService.logAutoHideComment(targetId, (int) pending, threshold);
                log.warn("Comment auto-hidden by report count. commentId={}, pendingReports={}, threshold={}",
                        targetId, pending, threshold);
            });
        }
    }

    /** Vô hiệu hóa mọi JWT đã cấp trước đó (claim tv). */
    private static void bumpTokenRevision(User user) {
        long v = user.getTokenRevision() == null ? 0L : user.getTokenRevision();
        user.setTokenRevision(v + 1);
    }
}
