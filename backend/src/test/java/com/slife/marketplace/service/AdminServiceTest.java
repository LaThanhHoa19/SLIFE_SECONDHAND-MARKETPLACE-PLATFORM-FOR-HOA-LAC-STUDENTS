package com.slife.marketplace.service;

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
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Bộ UTC theo ma trận ưu tiên người dùng yêu cầu:
 * <ul>
 *   <li>P1: updateUserStatus (security-sensitive)</li>
 *   <li>P2: adminHideListing (moderation)</li>
 *   <li>P3: getUsers (paging + filter)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService - UTC theo priority matrix")
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

    @Nested
    @DisplayName("P1 - updateUserStatus")
    class UpdateUserStatusUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [N] Ban ACTIVE -> BANNED: tokenRevision +1, ghi audit ban")
        void utcAdm01_banActiveUser() {
            User target = user(1L, "USER", "ACTIVE");
            target.setTokenRevision(5L);
            User admin = user(9L, "ADMIN", "ACTIVE");
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(target));

            String out = adminService.updateUserStatus(1L, "BANNED", admin);

            assertEquals("User status updated successfully", out);
            assertEquals("BANNED", target.getStatus());
            assertEquals(6L, target.getTokenRevision());
            verify(auditLogService).logUserBan(admin, 1L, "ACTIVE");
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [B] Ban user đã BANNED: tokenRevision giữ nguyên, vẫn success")
        void utcAdm02_banAlreadyBannedUser() {
            User target = user(1L, "USER", "BANNED");
            target.setTokenRevision(5L);
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(target));

            String out = adminService.updateUserStatus(1L, "BANNED", user(9L, "ADMIN", "ACTIVE"));

            assertEquals("User status updated successfully", out);
            assertEquals(5L, target.getTokenRevision());
            verify(auditLogService).logUserBan(any(User.class), eq(1L), eq("BANNED"));
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID-03 [N] Unban BANNED -> ACTIVE: đổi trạng thái và ghi audit mở khóa")
        void utcAdm03_unbanBannedUser() {
            User target = user(1L, "USER", "BANNED");
            User admin = user(9L, "ADMIN", "ACTIVE");
            when(userRepository.findByIdAndRole(1L, "USER")).thenReturn(Optional.of(target));

            String out = adminService.updateUserStatus(1L, "ACTIVE", admin);

            assertEquals("User status updated successfully", out);
            assertEquals("ACTIVE", target.getStatus());
            verify(auditLogService).logUserUnban(admin, 1L, "BANNED");
        }

        @Test
        @Tag("UTCID-04")
        @DisplayName("UTCID-04 [A] Status không hợp lệ (PENDING/RESTRICTED) -> INVALID_INPUT")
        void utcAdm04_invalidStatus() {
            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> adminService.updateUserStatus(1L, "PENDING", user(9L, "ADMIN", "ACTIVE"))
            );

            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("P2 - adminHideListing")
    class AdminHideListingUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [N] Ẩn listing ACTIVE: set MOD_HIDDEN và save")
        void utcAdm01_hideActiveListing() {
            Listing l = listing(1L, "ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            String out = adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE"));

            assertEquals("Listing hidden successfully", out);
            assertEquals("MOD_HIDDEN", l.getStatus());
            verify(listingRepository).save(l);
        }

        @Test
        @Tag("UTCID-2")
        @DisplayName("UTCID-2 [B] Listing đã MOD_HIDDEN: không save, trả already hidden")
        void utcAdm2_alreadyHiddenListing() {
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing(1L, "MOD_HIDDEN")));

            String out = adminService.adminHideListing(1L, user(9L, "ADMIN", "ACTIVE"));

            assertEquals("Listing already moderation-hidden", out);
            verify(listingRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("P3 - getUsers")
    class GetUsersUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [N] filter all: chỉ lấy USER, không lẫn role khác")
        void utcAdm01_filterAllUsers() {
            when(userRepository.findByRole(eq("USER"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(user(1L, "USER", "ACTIVE"))));

            Page<UserResponseDTO> out = adminService.getUsers(0, 20, "default", "desc", "all");

            assertEquals(1, out.getTotalElements());
            verify(userRepository).findByRole(eq("USER"), any(Pageable.class));
            verify(userRepository, never()).findByRoleAndStatus(any(), any(), any(Pageable.class));
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [N] Lọc ACTIVE: gọi đúng findByRoleAndStatus(USER, ACTIVE)")
        void utcAdm02_filterActiveUsers() {
            when(userRepository.findByRoleAndStatus(eq("USER"), eq("ACTIVE"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(user(1L, "USER", "ACTIVE"))));

            Page<UserResponseDTO> out = adminService.getUsers(0, 20, "createdAt", "asc", "ACTIVE");

            assertEquals(1, out.getTotalElements());
            verify(userRepository).findByRoleAndStatus(eq("USER"), eq("ACTIVE"), any(Pageable.class));
            assertTrue(out.getContent().stream().allMatch(u -> "ACTIVE".equals(u.status())));
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID-03 [B] page âm: normalize về page=0")
        void utcAdm03_negativePageNormalized() {
            when(userRepository.findByRole(eq("USER"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            adminService.getUsers(-1, 20, "id", "desc", "all");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(userRepository).findByRole(eq("USER"), pageableCaptor.capture());
            Pageable actual = pageableCaptor.getValue();
            assertEquals(0, actual.getPageNumber());
            assertEquals(20, actual.getPageSize());
        }

        @Test
        @Tag("UTCID-04")
        @DisplayName("UTCID-04 [B] size quá lớn: tự giới hạn tối đa 100")
        void utcAdm04_oversizedPageSizeNormalized() {
            when(userRepository.findByRole(eq("USER"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            adminService.getUsers(0, 1000, "id", "desc", "all");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(userRepository).findByRole(eq("USER"), pageableCaptor.capture());
            Pageable actual = pageableCaptor.getValue();
            assertEquals(0, actual.getPageNumber());
            assertEquals(100, actual.getPageSize());
        }
    }
}
