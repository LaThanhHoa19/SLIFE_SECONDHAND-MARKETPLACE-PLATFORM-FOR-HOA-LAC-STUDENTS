package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.AdminDashboardChartsResponse;
import com.slife.marketplace.dto.response.AdminDashboardStatsResponse;
import com.slife.marketplace.dto.response.CategoryStatDto;
import com.slife.marketplace.dto.response.DailyStatDto;
import com.slife.marketplace.dto.response.UserResponseDTO;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.ReportRepository;
import com.slife.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private static final int CHART_DAYS = 30;

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final ReportRepository reportRepository;
    private final DealRepository dealRepository;
    private final AuditLogService auditLogService;
    private final SystemEmailService systemEmailService;

    public AdminService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            CategoryRepository categoryRepository,
            ReportRepository reportRepository,
            DealRepository dealRepository,
            AuditLogService auditLogService,
            SystemEmailService systemEmailService) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.reportRepository = reportRepository;
        this.dealRepository = dealRepository;
        this.auditLogService = auditLogService;
        this.systemEmailService = systemEmailService;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats() {
        long listingTotal   = listingRepository.count();
        long categoryTotal  = categoryRepository.count();
        long userTotal      = userRepository.countByRole("USER");
        long reportTotal    = reportRepository.count();

        // Listing breakdown
        long listingActive   = listingRepository.countByStatus("ACTIVE");
        long listingHidden   = listingRepository.countByStatus("HIDDEN");
        long listingModHid   = listingRepository.countByStatus("MOD_HIDDEN");
        long listingExpired  = listingRepository.countByStatus("EXPIRED");
        long listingDraft    = listingRepository.countByStatus("DRAFT");

        // User breakdown (role=USER)
        long userActive      = userRepository.countByRoleAndStatus("USER", "ACTIVE");
        long userBanned      = userRepository.countByRoleAndStatus("USER", "BANNED");
        long userRestricted  = userRepository.countByRoleAndStatus("USER", "RESTRICTED");

        // Report breakdown
        long reportPending   = reportRepository.countByStatus("PENDING");
        long reportResolved  = reportRepository.countByStatus("RESOLVED");
        long reportRejected  = reportRepository.countByStatus("REJECTED");

        // Deal breakdown
        long dealPending     = dealRepository.countByStatusAndDeletedAtIsNull("PENDING");
        long dealConfirmed   = dealRepository.countByStatusAndDeletedAtIsNull("CONFIRMED");
        long dealCompleted   = dealRepository.countByStatusAndDeletedAtIsNull("COMPLETED");
        long dealCancelled   = dealRepository.countByStatusAndDeletedAtIsNull("CANCELLED");

        // Avg reputation
        BigDecimal avgRep = userRepository.averageReputationScoreForActiveUsers();
        double avgRepDouble = (avgRep != null) ? avgRep.doubleValue() : 0.0;

        // Top 5 danh mục
        List<CategoryStatDto> topCats = listingRepository
                .findTopCategoryStatsByActiveListings(Instant.now(), PageRequest.of(0, 5));

        return new AdminDashboardStatsResponse(
                listingTotal, categoryTotal, userTotal, reportTotal,
                listingActive, listingHidden, listingModHid, listingExpired, listingDraft,
                userActive, userBanned, userRestricted,
                reportPending, reportResolved, reportRejected,
                dealPending, dealConfirmed, dealCompleted, dealCancelled,
                avgRepDouble,
                topCats);
    }

    @Transactional(readOnly = true)
    public AdminDashboardChartsResponse getDashboardCharts() {
        return new AdminDashboardChartsResponse(
                toDaily(userRepository.countUsersByDayLast(CHART_DAYS)),
                toDaily(listingRepository.countListingsByDayLast(CHART_DAYS)),
                toDaily(dealRepository.countDealsByDayLast(CHART_DAYS)),
                toDaily(reportRepository.countReportsByDayLast(CHART_DAYS)));
    }

    /** Chuyển kết quả native query [{day, cnt}] thành List<DailyStatDto>. */
    private static List<DailyStatDto> toDaily(List<Object[]> rows) {
        List<DailyStatDto> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            String day   = row[0] != null ? row[0].toString() : "unknown";
            long   count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            result.add(new DailyStatDto(day, count));
        }
        return result;
    }

    public Page<UserResponseDTO> getUsers(int page, int size, String sortBy, String sortDir, String statusFilter) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = size <= 0 ? 20 : Math.min(size, 100);
        Sort sort = buildUserListSort(sortBy, sortDir);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, sort);

        Optional<String> status = resolveAdminUserStatusFilter(statusFilter);
        Page<User> pageResult = status.isEmpty()
                ? userRepository.findByRole("USER", pageable)
                : userRepository.findByRoleAndStatus("USER", status.get(), pageable);
        return pageResult.map(this::toUserResponseDTO);
    }

    private static Optional<String> resolveAdminUserStatusFilter(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw.trim())) {
            return Optional.empty();
        }
        String s = raw.trim().toUpperCase(Locale.ROOT);
        return switch (s) {
            case "ACTIVE", "BANNED", "RESTRICTED" -> Optional.of(s);
            default -> throw new SlifeException(ErrorCode.INVALID_INPUT,
                    "status must be all, ACTIVE, BANNED, or RESTRICTED");
        };
    }

    private static Sort buildUserListSort(String sortBy, String sortDir) {
        String raw = trimOrEmpty(sortBy);
        if (raw.isEmpty() || "none".equalsIgnoreCase(raw) || "default".equalsIgnoreCase(raw)) {
            return Sort.by(Sort.Direction.ASC, "id");
        }
        if ("id".equalsIgnoreCase(raw)) {
            Sort.Direction direction = "asc".equalsIgnoreCase(trimOrEmpty(sortDir))
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            return Sort.by(direction, "id");
        }
        String property = resolveAdminUserSortProperty(sortBy);
        Sort.Direction direction = "asc".equalsIgnoreCase(trimOrEmpty(sortDir))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }

    private static String resolveAdminUserSortProperty(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "createdAt";
        }
        return switch (sortBy.trim()) {
            case "reputationScore", "violationCount", "createdAt" -> sortBy.trim();
            default -> "createdAt";
        };
    }

    private static String trimOrEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    @Transactional
    public String updateUserStatus(Long id, String status, User admin) {
        String normalizedStatus = normalizeStatus(status);
        User user = userRepository.findByIdAndRole(id, "USER")
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        String previousStatus = user.getStatus();
        user.setStatus(normalizedStatus);
        if ("BANNED".equals(normalizedStatus)
                && (previousStatus == null || !"BANNED".equalsIgnoreCase(previousStatus.trim()))) {
            long v = user.getTokenRevision() == null ? 0L : user.getTokenRevision();
            user.setTokenRevision(v + 1);
            log.warn("Admin banned user — sessions revoked. userId={}, email={}", user.getId(), user.getEmail());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        systemEmailService.sendAdminUserStatusChangedEmail(user, normalizedStatus);

        if ("BANNED".equals(normalizedStatus)) {
            auditLogService.logUserBan(admin, id, previousStatus);
        } else if ("ACTIVE".equals(normalizedStatus)) {
            auditLogService.logUserUnban(admin, id, previousStatus);
        }

        return "User status updated successfully";
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "status is required");
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(normalized) && !"BANNED".equals(normalized)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "status must be ACTIVE or BANNED");
        }
        return normalized;
    }

    @Transactional
    public String adminHideListing(Long listingId, User admin) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        String previousStatus = listing.getStatus() != null ? listing.getStatus().trim().toUpperCase(Locale.ROOT) : "";
        if ("MOD_HIDDEN".equals(previousStatus)) {
            return "Listing already moderation-hidden";
        }

        listing.setStatus("MOD_HIDDEN");
        listing.setUpdatedAt(java.time.Instant.now());
        listingRepository.save(listing);

        log.warn("Admin hid listing. listingId={}, previousStatus={}, adminId={}",
                listingId, previousStatus, admin != null ? admin.getId() : null);
        return "Listing hidden successfully";
    }

    private UserResponseDTO toUserResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getStatus(),
                user.getRole(),
                user.getReputationScore(),
                user.getViolationCount(),
                user.getCreatedAt());
    }
}
