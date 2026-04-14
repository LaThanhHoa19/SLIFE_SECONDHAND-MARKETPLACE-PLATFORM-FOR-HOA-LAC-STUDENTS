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
import org.junit.jupiter.api.Tag;
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

/**
 * Ma trận UTC — {@link AdminService}. Mỗi {@link Nested} = một tab Excel theo thứ tự:
 * <ol>
 *   <li>{@code getDashboardStats}</li>
 *   <li>{@code getDashboardCharts}</li>
 *   <li>{@code getUsers}</li>
 *   <li>{@code updateUserStatus}</li>
 *   <li>{@code adminHideListing}</li>
 * </ol>
 * Chi tiết Precondition / Input / Confirm nằm trong JavaDoc từng tab và từng {@code @Test}.
 * <p>
 * Tóm tắt mã UTC:
 * <pre>
 * Mã        | Tab | Method               | Loại | Ghi chú ngắn
 * ----------|-----|----------------------|------|------------------
 * UTC-ADM-01|  1  | getDashboardStats    | N    | Repo đủ; avgRep null → 0
 * UTC-ADM-02|  2  | getDashboardCharts   | B    | cnt null → 0
 * UTC-ADM-03|  3  | getUsers             | N    | all → findByRole
 * UTC-ADM-04|  3  | getUsers             | A    | PENDING → INVALID_INPUT
 * UTC-ADM-05|  3  | getUsers             | B    | page/size clamp; sort id DESC
 * UTC-ADM-06|  3  | getUsers             | N    | ACTIVE → findByRoleAndStatus
 * UTC-ADM-07|  4  | updateUserStatus     | A    | status blank → INVALID_INPUT
 * UTC-ADM-08|  4  | updateUserStatus     | A    | RESTRICTED → INVALID_INPUT
 * UTC-ADM-09|  4  | updateUserStatus     | A    | user không có → USER_NOT_FOUND
 * UTC-ADM-10|  4  | updateUserStatus     | N    | ACTIVE→BANNED lần đầu; token+1; audit ban
 * UTC-ADM-11|  4  | updateUserStatus     | B    | đã BANNED + BANNED lại; token giữ; audit ban
 * UTC-ADM-12|  4  | updateUserStatus     | N    | BANNED→ACTIVE; audit unban
 * UTC-ADM-13|  5  | adminHideListing     | A    | không có listing → LISTING_NOT_FOUND
 * UTC-ADM-14|  5  | adminHideListing     | B    | đã MOD_HIDDEN; không save
 * UTC-ADM-15|  5  | adminHideListing     | N    | ACTIVE → MOD_HIDDEN + save
 * </pre>
 * Loại: N = Normal, A = Abnormal, B = Boundary.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService — ma trận UTC (5 tab)")
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

    /**
     * <h2>Tab 1 — {@link AdminService#getDashboardStats()}</h2>
     * <h3>UTC-ADM-01 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt>
     *   <dd>Stub đủ: {@code listing/category/user/report/deal} repositories trả các {@code count*}; {@code averageReputationScoreForActiveUsers()} → {@code null};
     *   {@code findTopCategoryStatsByActiveListings} → 1 {@link CategoryStatDto}.</dd>
     *   <dt>Input</dt>
     *   <dd>Không tham số (gọi trực tiếp {@code getDashboardStats()}).</dd>
     *   <dt>Return (Confirm)</dt>
     *   <dd>{@link AdminDashboardStatsResponse}: các trường count khớp stub; {@code avgReputationScore == 0.0}; {@code topCategories} size 1.</dd>
     *   <dt>Exception</dt>
     *   <dd>Không.</dd>
     *   <dt>Log</dt>
     *   <dd>Không assert trong UTC.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 1 · getDashboardStats")
    class GetDashboardStats {

        @Test
        @Tag("UTC-ADM-01")
        @DisplayName("UTC-ADM-01 [N] Thống kê dashboard: đủ count từ repo; điểm uy tín null → 0; có top danh mục")
        void utcAdm01_statsFullMapping() {
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
    }

    /**
     * <h2>Tab 2 — {@link AdminService#getDashboardCharts()}</h2>
     * <h3>UTC-ADM-02 [B]</h3>
     * <dl>
     *   <dt>Precondition</dt>
     *   <dd>Stub {@code countUsersByDayLast}, {@code countListingsByDayLast}, {@code countDealsByDayLast}, {@code countReportsByDayLast}
     *   mỗi nguồn một dòng {@code [day, cnt]}; riêng report có {@code cnt = null}.</dd>
     *   <dt>Input</dt>
     *   <dd>Không tham số.</dd>
     *   <dt>Return (Confirm)</dt>
     *   <dd>{@link AdminDashboardChartsResponse}: {@code reportTrend} có {@link DailyStatDto} với {@code count=0L}.</dd>
     *   <dt>Exception</dt>
     *   <dd>Không.</dd>
     *   <dt>Log</dt>
     *   <dd>Không assert.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 2 · getDashboardCharts")
    class GetDashboardCharts {

        @Test
        @Tag("UTC-ADM-02")
        @DisplayName("UTC-ADM-02 [B] Biểu đồ: dòng native có count null → map thành 0 (an toàn null)")
        void utcAdm02_nullCountBecomesZero() {
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

    /**
     * <h2>Tab 3 — {@link AdminService#getUsers(int, int, String, String, String)}</h2>
     * <h3>UTC-ADM-03 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Stub {@code findByRole("USER", pageable)} trả {@link Page} có ≥1 user {@code role=USER}.</dd>
     *   <dt>Input</dt><dd>{@code page=0, size=20, sortBy=default, sortDir=desc, statusFilter=all}.</dd>
     *   <dt>Return</dt><dd>Page DTO {@code totalElements=1}; chỉ gọi {@code findByRole}.</dd>
     *   <dt>Exception</dt><dd>Không.</dd>
     * </dl>
     * <h3>UTC-ADM-04 [A]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Không cần stub repo (lỗi khi resolve filter).</dd>
     *   <dt>Input</dt><dd>{@code statusFilter=PENDING}.</dd>
     *   <dt>Exception</dt><dd>{@link ErrorCode#INVALID_INPUT}.</dd>
     * </dl>
     * <h3>UTC-ADM-05 [B]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Stub {@code findByRole} trả page rỗng.</dd>
     *   <dt>Input</dt><dd>{@code page=-1, size=999, sortBy=id, sortDir=desc, statusFilter=null} (null coi như all).</dd>
     *   <dt>Return / side effect</dt><dd>Pageable: page 0, size 100, sort field {@code id} DESC.</dd>
     * </dl>
     * <h3>UTC-ADM-06 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Stub {@code findByRoleAndStatus("USER","ACTIVE",·)} trả page 1 user.</dd>
     *   <dt>Input</dt><dd>{@code statusFilter=ACTIVE}, các tham số còn lại hợp lệ.</dd>
     *   <dt>Return</dt><dd>Page DTO 1 phần tử; verify {@code findByRoleAndStatus}.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 3 · getUsers")
    class GetUsers {

        /**
         * UTC-ADM-03 — xem khối JavaDoc {@link GetUsers} (Tab 3).
         */
        @Test
        @Tag("UTC-ADM-03")
        @DisplayName("UTC-ADM-03 [N] Lọc all: chỉ theo role USER (findByRole)")
        void utcAdm03_statusAllQueriesByRole() {
            Page<User> page = new PageImpl<>(List.of(user(1L, "USER", "ACTIVE")));
            when(userRepository.findByRole(eq("USER"), any(Pageable.class))).thenReturn(page);

            Page<UserResponseDTO> out = adminService.getUsers(0, 20, "default", "desc", "all");

            assertEquals(1, out.getTotalElements());
            verify(userRepository).findByRole(eq("USER"), any(Pageable.class));
            verify(userRepository, never()).findByRoleAndStatus(anyString(), anyString(), any(Pageable.class));
        }

        /**
         * UTC-ADM-04 — xem khối JavaDoc {@link GetUsers} (Tab 3).
         */
        @Test
        @Tag("UTC-ADM-04")
        @DisplayName("UTC-ADM-04 [A] Lọc status không hợp lệ (PENDING) → SlifeException INVALID_INPUT")
        void utcAdm04_invalidStatusFilter() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.getUsers(0, 20, "createdAt", "desc", "PENDING"));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        /**
         * UTC-ADM-05 — xem khối JavaDoc {@link GetUsers} (Tab 3).
         */
        @Test
        @Tag("UTC-ADM-05")
        @DisplayName("UTC-ADM-05 [B] Phân trang/sắp xếp: page âm → 0; size vượt trần → 100; sort id DESC")
        void utcAdm05_pagingAndSortClamp() {
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

        /**
         * UTC-ADM-06 — xem khối JavaDoc {@link GetUsers} (Tab 3).
         */
        @Test
        @Tag("UTC-ADM-06")
        @DisplayName("UTC-ADM-06 [N] Lọc ACTIVE: findByRoleAndStatus USER + ACTIVE")
        void utcAdm06_statusActive() {
            Page<User> page = new PageImpl<>(List.of(user(1L, "USER", "ACTIVE")));
            when(userRepository.findByRoleAndStatus(eq("USER"), eq("ACTIVE"), any(Pageable.class))).thenReturn(page);

            Page<UserResponseDTO> out = adminService.getUsers(0, 20, "createdAt", "asc", "ACTIVE");

            assertEquals(1, out.getTotalElements());
            verify(userRepository).findByRoleAndStatus(eq("USER"), eq("ACTIVE"), any(Pageable.class));
        }
    }

    /**
     * <h2>Tab 4 — {@link AdminService#updateUserStatus(Long, String, User)}</h2>
     * <p>Sau {@code normalizeStatus} chỉ còn {@code ACTIVE} / {@code BANNED}. Chuỗi rỗng hoặc giá trị khác (vd. {@code RESTRICTED}) → {@link ErrorCode#INVALID_INPUT}
     * trước khi load user. Khi ban lần đầu, service tăng {@code tokenRevision} và ghi log WARN (test không assert log).
     *
     * <h3>UTC-ADM-07 [A]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Không stub {@code findByIdAndRole} (không tới tầng persistence).</dd>
     *   <dt>Input</dt><dd>{@code id=1L}, {@code status="   "}, {@code admin} ADMIN ACTIVE.</dd>
     *   <dt>Return</dt><dd>Không.</dd>
     *   <dt>Exception</dt><dd>{@link SlifeException} — {@link ErrorCode#INVALID_INPUT}.</dd>
     *   <dt>Log</dt><dd>Không assert.</dd>
     * </dl>
     *
     * <h3>UTC-ADM-08 [A]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Không stub {@code findByIdAndRole}.</dd>
     *   <dt>Input</dt><dd>{@code status=RESTRICTED} (không phải ACTIVE/BANNED sau normalize).</dd>
     *   <dt>Exception</dt><dd>{@link ErrorCode#INVALID_INPUT}.</dd>
     * </dl>
     *
     * <h3>UTC-ADM-09 [A]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>{@code findByIdAndRole(1L,"USER") → Optional.empty()}.</dd>
     *   <dt>Input</dt><dd>{@code status=BANNED}, admin hợp lệ.</dd>
     *   <dt>Exception</dt><dd>{@link ErrorCode#USER_NOT_FOUND}.</dd>
     * </dl>
     *
     * <h3>UTC-ADM-10 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>User id 1 role USER, {@code status=ACTIVE}, {@code tokenRevision=5}; stub trả {@link Optional#of}.</dd>
     *   <dt>Input</dt><dd>{@code status=BANNED}.</dd>
     *   <dt>Return</dt><dd>Chuỗi {@code "User status updated successfully"}; entity {@code status=BANNED}, {@code tokenRevision=6}.</dd>
     *   <dt>Side effect / audit</dt><dd>{@code auditLogService.logUserBan(admin, 1L, "ACTIVE")}; không gọi {@code logUserUnban}.</dd>
     *   <dt>Log (runtime)</dt><dd>Service có WARN khi ban lần đầu — không verify trong UTC.</dd>
     * </dl>
     *
     * <h3>UTC-ADM-11 [B]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>User đã {@code BANNED}, {@code tokenRevision=5}.</dd>
     *   <dt>Input</dt><dd>{@code status=BANNED} lặp lại.</dd>
     *   <dt>Return</dt><dd>Message thành công (luồng vẫn save + email + audit theo code).</dd>
     *   <dt>Confirm</dt><dd>{@code tokenRevision} vẫn 5; {@code logUserBan(admin, 1L, "BANNED")}.</dd>
     * </dl>
     *
     * <h3>UTC-ADM-12 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>User {@code BANNED}.</dd>
     *   <dt>Input</dt><dd>{@code status=ACTIVE}.</dd>
     *   <dt>Confirm</dt><dd>{@code auditLogService.logUserUnban(admin, 1L, "BANNED")}.</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 4 · updateUserStatus")
    class UpdateUserStatus {

        /**
         * UTC-ADM-07 — xem {@link UpdateUserStatus} (Tab 4).
         */
        @Test
        @Tag("UTC-ADM-07")
        @DisplayName("UTC-ADM-07 [A] Status rỗng/khoảng trắng → INVALID_INPUT")
        void utcAdm07_blankStatus() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.updateUserStatus(1L, "   ", user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        /**
         * UTC-ADM-08 — xem {@link UpdateUserStatus} (Tab 4).
         */
        @Test
        @Tag("UTC-ADM-08")
        @DisplayName("UTC-ADM-08 [A] Status không được phép (RESTRICTED; chỉ ACTIVE/BANNED) → INVALID_INPUT")
        void utcAdm08_invalidNormalizedStatus() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.updateUserStatus(1L, "RESTRICTED", user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        /**
         * UTC-ADM-09 — xem {@link UpdateUserStatus} (Tab 4).
         */
        @Test
        @Tag("UTC-ADM-09")
        @DisplayName("UTC-ADM-09 [A] Không có user role USER với id đó → USER_NOT_FOUND")
        void utcAdm09_userNotFound() {
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.updateUserStatus(1L, "BANNED", user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        /**
         * UTC-ADM-10 — xem {@link UpdateUserStatus} (Tab 4).
         */
        @Test
        @Tag("UTC-ADM-10")
        @DisplayName("UTC-ADM-10 [N] Khóa lần đầu ACTIVE→BANNED: tăng tokenRevision + audit ban + message thành công")
        void utcAdm10_banFirstTime() {
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

        /**
         * UTC-ADM-11 — xem {@link UpdateUserStatus} (Tab 4).
         */
        @Test
        @Tag("UTC-ADM-11")
        @DisplayName("UTC-ADM-11 [B] Đã BANNED, admin gửi BANNED lại: không tăng token; vẫn ghi audit ban")
        void utcAdm11_banIdempotent() {
            User u = user(1L, "USER", "BANNED");
            u.setTokenRevision(5L);
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(u));

            adminService.updateUserStatus(1L, "BANNED", user(9L, "ADMIN", "ACTIVE"));

            assertEquals(5L, u.getTokenRevision());
            verify(auditLogService).logUserBan(any(User.class), eq(1L), eq("BANNED"));
        }

        /**
         * UTC-ADM-12 — xem {@link UpdateUserStatus} (Tab 4).
         */
        @Test
        @Tag("UTC-ADM-12")
        @DisplayName("UTC-ADM-12 [N] Gỡ ban BANNED→ACTIVE: audit log unban")
        void utcAdm12_unban() {
            User u = user(1L, "USER", "BANNED");
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(u));

            adminService.updateUserStatus(1L, "ACTIVE", user(9L, "ADMIN", "ACTIVE"));

            verify(auditLogService).logUserUnban(any(User.class), eq(1L), eq("BANNED"));
        }
    }

    /**
     * <h2>Tab 5 — {@link AdminService#adminHideListing(Long, User)}</h2>
     *
     * <h3>UTC-ADM-13 [A]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>{@code listingRepository.findById(1L) → Optional.empty()}.</dd>
     *   <dt>Input</dt><dd>{@code listingId=1L}, admin ADMIN.</dd>
     *   <dt>Exception</dt><dd>{@link ErrorCode#LISTING_NOT_FOUND}.</dd>
     * </dl>
     *
     * <h3>UTC-ADM-14 [B]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Listing tồn tại, {@code status=MOD_HIDDEN}.</dd>
     *   <dt>Return</dt><dd>{@code "Listing already moderation-hidden"}.</dd>
     *   <dt>Side effect</dt><dd>Không gọi {@code save}.</dd>
     * </dl>
     *
     * <h3>UTC-ADM-15 [N]</h3>
     * <dl>
     *   <dt>Precondition</dt><dd>Listing {@code ACTIVE}.</dd>
     *   <dt>Return</dt><dd>{@code "Listing hidden successfully"}; status {@code MOD_HIDDEN}.</dd>
     *   <dt>Side effect</dt><dd>{@code listingRepository.save(listing)}; log WARN (không assert).</dd>
     * </dl>
     */
    @Nested
    @DisplayName("Tab 5 · adminHideListing")
    class AdminHideListing {

        /**
         * UTC-ADM-13 — xem {@link AdminHideListing} (Tab 5).
         */
        @Test
        @Tag("UTC-ADM-13")
        @DisplayName("UTC-ADM-13 [A] Tin không tồn tại → LISTING_NOT_FOUND")
        void utcAdm13_listingMissing() {
            when(listingRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE")));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        /**
         * UTC-ADM-14 — xem {@link AdminHideListing} (Tab 5).
         */
        @Test
        @Tag("UTC-ADM-14")
        @DisplayName("UTC-ADM-14 [B] Tin đã MOD_HIDDEN: trả thông báo đã ẩn; không gọi save")
        void utcAdm14_alreadyModHidden() {
            Listing l = listing(1L, "MOD_HIDDEN");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            String out = adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE"));

            assertEquals("Listing already moderation-hidden", out);
            verify(listingRepository, never()).save(any());
        }

        /**
         * UTC-ADM-15 — xem {@link AdminHideListing} (Tab 5).
         */
        @Test
        @Tag("UTC-ADM-15")
        @DisplayName("UTC-ADM-15 [N] Tin ACTIVE: đặt MOD_HIDDEN, save, thông báo thành công")
        void utcAdm15_hideSuccess() {
            Listing l = listing(1L, "ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            String out = adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE"));

            assertEquals("Listing hidden successfully", out);
            assertEquals("MOD_HIDDEN", l.getStatus());
            verify(listingRepository).save(l);
        }
    }
}
