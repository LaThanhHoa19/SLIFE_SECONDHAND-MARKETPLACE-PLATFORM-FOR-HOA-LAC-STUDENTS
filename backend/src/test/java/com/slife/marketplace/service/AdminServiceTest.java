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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ReportRepository reportRepository;
    @Mock private DealRepository dealRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private SystemEmailService systemEmailService;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                userRepository,
                listingRepository,
                categoryRepository,
                reportRepository,
                dealRepository,
                auditLogService,
                systemEmailService
        );
    }

    private static User user(long id, String role, String status) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setStatus(status);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        u.setCreatedAt(LocalDateTime.of(2024, 1, 1, 0, 0));
        return u;
    }

    private static Listing listing(long id, String status) {
        Listing l = new Listing();
        l.setId(id);
        l.setStatus(status);
        return l;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Dashboard (getDashboardStats / getDashboardCharts)")
    class Dashboard {

        @Test
        @DisplayName("getDashboardStats: map đủ count + avg reputation null → 0.0 + top categories")
        void getDashboardStats_shouldMapCountsAndAvgRep() {
            when(listingRepository.count()).thenReturn(100L);
            when(categoryRepository.count()).thenReturn(5L);
            when(userRepository.countByRole("USER")).thenReturn(20L);
            when(reportRepository.count()).thenReturn(7L);

            when(listingRepository.countByStatus("ACTIVE")).thenReturn(10L);
            when(listingRepository.countByStatus("HIDDEN")).thenReturn(2L);
            when(listingRepository.countByStatus("MOD_HIDDEN")).thenReturn(1L);
            when(listingRepository.countByStatus("EXPIRED")).thenReturn(3L);
            when(listingRepository.countByStatus("DRAFT")).thenReturn(4L);

            when(userRepository.countByRoleAndStatus("USER", "ACTIVE")).thenReturn(12L);
            when(userRepository.countByRoleAndStatus("USER", "BANNED")).thenReturn(2L);
            when(userRepository.countByRoleAndStatus("USER", "RESTRICTED")).thenReturn(1L);

            when(reportRepository.countByStatus("PENDING")).thenReturn(3L);
            when(reportRepository.countByStatus("RESOLVED")).thenReturn(2L);
            when(reportRepository.countByStatus("REJECTED")).thenReturn(1L);

            when(dealRepository.countByStatusAndDeletedAtIsNull("PENDING")).thenReturn(9L);
            when(dealRepository.countByStatusAndDeletedAtIsNull("CONFIRMED")).thenReturn(8L);
            when(dealRepository.countByStatusAndDeletedAtIsNull("COMPLETED")).thenReturn(7L);
            when(dealRepository.countByStatusAndDeletedAtIsNull("CANCELLED")).thenReturn(6L);

            when(userRepository.averageReputationScoreForActiveUsers()).thenReturn(null);
            when(listingRepository.findTopCategoryStatsByActiveListings(any(Instant.class), any(PageRequest.class)))
                    .thenReturn(List.of(new CategoryStatDto(1L, "C1", 10L)));

            AdminDashboardStatsResponse out = adminService.getDashboardStats();

            assertEquals(100L, out.listingCount());
            assertEquals(5L, out.categoryCount());
            assertEquals(20L, out.userCount());
            assertEquals(7L, out.reportCount());
            assertEquals(0.0, out.avgReputationScore());
            assertEquals(1, out.topCategories().size());
        }

        @Test
        @DisplayName("getDashboardCharts: map native rows {day,cnt} → DailyStatDto, null count → 0")
        void getDashboardCharts_shouldMapToDailyStats() {
            List<Object[]> u = List.<Object[]>of(new Object[]{"2026-01-01", 2L});
            List<Object[]> l = List.<Object[]>of(new Object[]{"2026-01-01", 3L});
            List<Object[]> d = List.<Object[]>of(new Object[]{"2026-01-01", 4L});
            List<Object[]> r = List.<Object[]>of(new Object[]{"2026-01-01", null});
            when(userRepository.countUsersByDayLast(anyInt())).thenReturn(u);
            when(listingRepository.countListingsByDayLast(anyInt())).thenReturn(l);
            when(dealRepository.countDealsByDayLast(anyInt())).thenReturn(d);
            when(reportRepository.countReportsByDayLast(anyInt())).thenReturn(r);

            AdminDashboardChartsResponse out = adminService.getDashboardCharts();

            assertEquals(List.of(new DailyStatDto("2026-01-01", 2L)), out.userGrowth());
            assertEquals(List.of(new DailyStatDto("2026-01-01", 3L)), out.listingGrowth());
            assertEquals(List.of(new DailyStatDto("2026-01-01", 4L)), out.dealTrend());
            assertEquals(List.of(new DailyStatDto("2026-01-01", 0L)), out.reportTrend());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Danh sách users (getUsers)")
    class GetUsers {

        @Test
        @DisplayName("statusFilter=all/blank → query theo role USER")
        void getUsers_all_shouldQueryByRoleOnly() {
            Page<User> page = new PageImpl<>(List.of(user(1L, "USER", "ACTIVE")));
            when(userRepository.findByRole(eq("USER"), any(Pageable.class))).thenReturn(page);

            Page<UserResponseDTO> out = adminService.getUsers(0, 20, "default", "desc", "all");

            assertEquals(1, out.getTotalElements());
            verify(userRepository).findByRole(eq("USER"), any(Pageable.class));
            verify(userRepository, never()).findByRoleAndStatus(anyString(), anyString(), any(Pageable.class));
        }

        @Test
        @DisplayName("[Lỗi] statusFilter sai → INVALID_INPUT")
        void getUsers_invalidStatus_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.getUsers(0, 20, "createdAt", "desc", "PENDING"));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("sortBy=id, sortDir=desc → pageable sort desc id; size clamp 100")
        void getUsers_sortAndPaging_shouldNormalize() {
            when(userRepository.findByRole(eq("USER"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            adminService.getUsers(-1, 999, "id", "desc", null);

            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(userRepository).findByRole(eq("USER"), cap.capture());
            Pageable p = cap.getValue();
            assertEquals(0, p.getPageNumber());
            assertEquals(100, p.getPageSize());
            Sort.Order order = p.getSort().getOrderFor("id");
            assertNotNull(order);
            assertEquals(Sort.Direction.DESC, order.getDirection());
        }

        @Test
        @DisplayName("statusFilter=ACTIVE → query theo role+status")
        void getUsers_active_shouldQueryByRoleAndStatus() {
            Page<User> page = new PageImpl<>(List.of(user(1L, "USER", "ACTIVE")));
            when(userRepository.findByRoleAndStatus(eq("USER"), eq("ACTIVE"), any(Pageable.class))).thenReturn(page);

            Page<UserResponseDTO> out = adminService.getUsers(0, 20, "createdAt", "asc", "ACTIVE");

            assertEquals(1, out.getTotalElements());
            verify(userRepository).findByRoleAndStatus(eq("USER"), eq("ACTIVE"), any(Pageable.class));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Cập nhật trạng thái user (updateUserStatus)")
    class UpdateUserStatus {

        @Test
        @DisplayName("[Lỗi] status null/blank → INVALID_INPUT")
        void blankStatus_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.updateUserStatus(1L, "   ", user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] status không hợp lệ → INVALID_INPUT")
        void invalidStatus_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.updateUserStatus(1L, "RESTRICTED", user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] user không tồn tại → USER_NOT_FOUND")
        void userMissing_shouldThrow() {
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.updateUserStatus(1L, "BANNED", user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] BANNED lần đầu → tăng tokenRevision + audit log ban")
        void banFirstTime_shouldRevokeSessionsAndAudit() {
            User u = user(1L, "USER", "ACTIVE");
            u.setTokenRevision(5L);
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(u));

            String out = adminService.updateUserStatus(1L, "BANNED", user(9L, "ADMIN", "ACTIVE"));

            assertEquals("User status updated successfully", out);
            assertEquals("BANNED", u.getStatus());
            assertEquals(6L, u.getTokenRevision());
            verify(auditLogService).logUserBan(any(User.class), eq(1L), eq("ACTIVE"));
            verify(auditLogService, never()).logUserUnban(any(), anyLong(), any());
        }

        @Test
        @DisplayName("[Lỗi] BANNED khi đã BANNED → không tăng tokenRevision nhưng vẫn logUserBan")
        void banAlreadyBanned_shouldNotIncrement() {
            User u = user(1L, "USER", "BANNED");
            u.setTokenRevision(5L);
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(u));

            adminService.updateUserStatus(1L, "BANNED", user(9L, "ADMIN", "ACTIVE"));

            assertEquals(5L, u.getTokenRevision());
            verify(auditLogService).logUserBan(any(User.class), eq(1L), eq("BANNED"));
        }

        @Test
        @DisplayName("ACTIVE (unban) → audit log unban")
        void unban_shouldAuditUnban() {
            User u = user(1L, "USER", "BANNED");
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(u));

            adminService.updateUserStatus(1L, "ACTIVE", user(9L, "ADMIN", "ACTIVE"));

            verify(auditLogService).logUserUnban(any(User.class), eq(1L), eq("BANNED"));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Admin ẩn tin (adminHideListing)")
    class AdminHideListing {

        @Test
        @DisplayName("[Lỗi] listing không tồn tại → LISTING_NOT_FOUND")
        void missingListing_shouldThrow() {
            when(listingRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Đã MOD_HIDDEN → return message, không save")
        void alreadyModHidden_shouldReturn() {
            Listing l = listing(1L, "MOD_HIDDEN");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            String out = adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE"));

            assertEquals("Listing already moderation-hidden", out);
            verify(listingRepository, never()).save(any());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: set status MOD_HIDDEN + save")
        void hide_shouldSave() {
            Listing l = listing(1L, "ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            String out = adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE"));

            assertEquals("Listing hidden successfully", out);
            assertEquals("MOD_HIDDEN", l.getStatus());
            verify(listingRepository).save(l);
        }
    }
}

