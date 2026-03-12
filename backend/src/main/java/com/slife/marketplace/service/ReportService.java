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
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.Report;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.ReportRepository;
import com.slife.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);
    private static final Set<String> VALID_TARGET_TYPES = Set.of("LISTING", "USER");
    private static final Set<String> VALID_RESOLVE_STATUSES = Set.of("RESOLVED", "DISMISSED");

    private final ReportRepository reportRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ReportService(ReportRepository reportRepository,
                         ListingRepository listingRepository,
                         UserRepository userRepository,
                         NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReportResponse createReport(User reporter, ReportRequest request) {
        String targetType = request.getTargetType().toUpperCase();
        if (!VALID_TARGET_TYPES.contains(targetType)) {
            throw new SlifeException(ErrorCode.REPORT_INVALID_TARGET);
        }

        if (reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(
                reporter.getId(), targetType, request.getTargetId())) {
            throw new SlifeException(ErrorCode.REPORT_DUPLICATE);
        }

        if ("LISTING".equals(targetType)) {
            return createListingReport(reporter, request, targetType);
        } else {
            return createUserReport(reporter, request, targetType);
        }
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getReports(String targetType, String status, int page, int size) {
        String normalizedType = (targetType != null && !targetType.isBlank()) ? targetType.toUpperCase() : null;
        String normalizedStatus = (status != null && !status.isBlank()) ? status.toUpperCase() : null;

        Page<Report> reports = reportRepository.findByFilters(
                normalizedType, normalizedStatus, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));

        return reports.map(ReportResponse::from);
    }

    @Transactional
    public ReportResponse resolveReport(Long reportId, User admin, ResolveReportRequest request) {
        String resolveStatus = request.getStatus().toUpperCase();
        if (!VALID_RESOLVE_STATUSES.contains(resolveStatus)) {
            throw new SlifeException(ErrorCode.REPORT_INVALID_STATUS);
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new SlifeException(ErrorCode.REPORT_NOT_FOUND));

        report.setStatus(resolveStatus);
        report.setAdminNote(request.getAdminNote());
        report.setHandledBy(admin);
        report.setUpdatedAt(Instant.now());

        Report saved = reportRepository.save(report);
        log.info("Report id={} resolved as {} by admin={}", reportId, resolveStatus, admin.getId());
        return ReportResponse.from(saved);
    }

    private ReportResponse createListingReport(User reporter, ReportRequest request, String targetType) {
        Listing listing = listingRepository.findById(request.getTargetId())
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (listing.getSeller().getId().equals(reporter.getId())) {
            throw new SlifeException(ErrorCode.REPORT_SELF);
        }

        Report report = buildReport(reporter, targetType, request);
        Report saved = reportRepository.save(report);

        notificationService.notifyListingReported(listing.getSeller(), reporter, listing.getId(), listing.getTitle());
        log.info("Listing report created: reportId={} listingId={} by userId={}", saved.getId(), listing.getId(), reporter.getId());

        return ReportResponse.from(saved);
    }

    private ReportResponse createUserReport(User reporter, ReportRequest request, String targetType) {
        User targetUser = userRepository.findById(request.getTargetId())
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        if (targetUser.getId().equals(reporter.getId())) {
            throw new SlifeException(ErrorCode.REPORT_SELF);
        }

        Report report = buildReport(reporter, targetType, request);
        Report saved = reportRepository.save(report);

        log.info("User report created: reportId={} targetUserId={} by userId={}", saved.getId(), targetUser.getId(), reporter.getId());
        return ReportResponse.from(saved);
    }

    private Report buildReport(User reporter, String targetType, ReportRequest request) {
        Report report = new Report();
        report.setReporter(reporter);
        report.setTargetType(targetType);
        report.setTargetId(request.getTargetId());
        report.setReason(request.getReason());
        report.setEvidenceImage(request.getEvidenceImage());
        report.setStatus("PENDING");
        report.setCreatedAt(Instant.now());
        report.setUpdatedAt(Instant.now());
        return report;
    }
}
