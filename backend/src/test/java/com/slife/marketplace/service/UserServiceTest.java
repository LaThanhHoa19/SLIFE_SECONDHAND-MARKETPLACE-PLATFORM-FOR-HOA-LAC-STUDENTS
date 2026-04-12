package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.UpdateUserRequest;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
/**
 * Unit test cho {@link UserService}.
 *
 * Mục tiêu:
 * - Kiểm tra đúng business rules + nhánh quan trọng (auth/ownership/state/edge cases).
 * - Không chạm DB/FS/HTTP: mọi dependency đều mock (repository, file storage).
 *
 * Cách test:
 * - Dựng SecurityContext giả để mô phỏng session hiện tại.
 * - Stub repository theo từng tình huống (found/not found/exception).
 * - Verify side-effects: gọi repo/save, set field đúng, ném đúng {@link SlifeException}/{@link ErrorCode}.
 */
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserFileStorageService userFileStorage;

    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(userRepository, userFileStorage);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static User user(long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFullName("U" + id);
        return u;
    }

    private static void authAsEmail(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "pw", List.of())
        );
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Email & user đăng nhập")
    class CurrentUser {
        @Test
        @DisplayName("[Lỗi] no auth → UNAUTHORIZED")
        void noAuth_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getCurrentUserEmail());
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] principal string blank → UNAUTHORIZED")
        void blankPrincipal_shouldThrow() {
            authAsEmail("   ");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getCurrentUserEmail());
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] getCurrentUser: user not found → UNAUTHORIZED")
        void userNotFound_shouldThrow() {
            authAsEmail("a@ex.com");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getCurrentUser());
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("getCurrentUserOptional: when unauthorized → empty")
        void optionalUnauthorized_empty() {
            assertTrue(service.getCurrentUserOptional().isEmpty());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Lấy user theo id")
    class GetById {
        @Test
        @DisplayName("[Lỗi] user không tồn tại → USER_NOT_FOUND")
        void missing_shouldThrow() {
            when(userRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getUserById(404L));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] luồng thành công → trả entity")
        void found_shouldReturn() {
            User u = user(1L, "a@ex.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));
            assertSame(u, service.getUserById(1L));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Xác minh SĐT Firebase")
    class PhoneVerify {
        @Test
        @DisplayName("[Thường] luồng thành công: set phone + verifiedAt + reload")
        void happyPath() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));

            User out = service.markPhoneVerifiedWithFirebase("+841234");
            assertEquals("+841234", out.getPhoneNumber());
            assertNotNull(out.getPhoneVerifiedAt());
        }

        @Test
        @DisplayName("[Lỗi] reload missing → INTERNAL_ERROR")
        void reloadMissing_shouldThrow() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> service.markPhoneVerifiedWithFirebase("+841"));
            assertEquals(ErrorCode.INTERNAL_ERROR, ex.getErrorCode());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Cập nhật thông tin user")
    class Update {
        @Test
        @DisplayName("null request → still keeps fullName fallback")
        void nullRequest_shouldFallbackFullName() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            u.setFullName("   ");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User out = service.updateCurrentUser(null);
            assertEquals("a@ex.com", out.getFullName());
        }

        @Test
        @DisplayName("phone changed → clear phoneVerifiedAt")
        void phoneChanged_shouldClearVerifiedAt() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            u.setPhoneNumber("+84901234567");
            u.setPhoneVerifiedAt(LocalDateTime.now());
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateUserRequest req = new UpdateUserRequest();
            req.setPhoneNumber("0901234567"); // same VN subscriber -> should NOT clear
            User out1 = service.updateCurrentUser(req);
            assertNotNull(out1.getPhoneVerifiedAt());

            UpdateUserRequest req2 = new UpdateUserRequest();
            req2.setPhoneNumber("0909999999"); // different -> clear
            User out2 = service.updateCurrentUser(req2);
            assertNull(out2.getPhoneVerifiedAt());
        }

        @Test
        @DisplayName("blank fields → set null (bio/avatar/cover)")
        void blankFields_shouldBecomeNull() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateUserRequest req = new UpdateUserRequest();
            req.setBio("   ");
            req.setAvatarUrl(" ");
            req.setCoverImageUrl(" ");
            User out = service.updateCurrentUser(req);
            assertNull(out.getBio());
            assertNull(out.getAvatarUrl());
            assertNull(out.getCoverImageUrl());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Tải avatar / ảnh bìa")
    class Uploads {

        @Test
        @DisplayName("[Lỗi] file null/empty → INVALID_INPUT")
        void invalidFile_shouldThrow() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.uploadAvatar(null)).getErrorCode());
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.uploadCover(new MockMultipartFile("f","a.png","image/png", new byte[0]))).getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] file too large → INVALID_INPUT")
        void tooLarge_shouldThrow() {
            byte[] big = new byte[5 * 1024 * 1024 + 1];
            MockMultipartFile f = new MockMultipartFile("f", "a.png", "image/png", big);
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.uploadAvatar(f)).getErrorCode());
        }

        @Test
        @DisplayName("uploadAvatar: lưu file dưới avatars/{userId}_*.{ext} và persist avatarUrl + updatedAt")
        void uploadAvatar_happyPath() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userFileStorage.storeMultipart(any(), anyString()))
                    .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

            MockMultipartFile f = new MockMultipartFile("f", "a.JPEG", "image/jpeg", new byte[]{1,2,3});
            User out = service.uploadAvatar(f);
            assertNotNull(out.getAvatarUrl());
            assertEquals("/uploads/avatars/1_", out.getAvatarUrl().substring(0, "/uploads/avatars/1_".length()));
            assertTrue(out.getAvatarUrl().endsWith(".jpeg"));
            assertNotNull(out.getUpdatedAt());
            verify(userFileStorage).storeMultipart(eq(f), argThat((String rel) ->
                    rel != null && rel.startsWith("avatars/1_") && rel.endsWith(".jpeg")));
            verify(userRepository).save(argThat(saved ->
                    saved.getAvatarUrl() != null && saved.getAvatarUrl().equals(out.getAvatarUrl())));
        }

        @Test
        @DisplayName("uploadCover: lưu dưới covers/ và set coverImageUrl (không đụng avatarUrl)")
        void uploadCover_happyPath() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            u.setAvatarUrl("https://old/avatar");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userFileStorage.storeMultipart(any(), anyString()))
                    .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

            MockMultipartFile f = new MockMultipartFile("f", "c.png", "image/png", new byte[]{1,2,3});
            User out = service.uploadCover(f);
            assertEquals("https://old/avatar", out.getAvatarUrl());
            assertNotNull(out.getCoverImageUrl());
            assertTrue(out.getCoverImageUrl().startsWith("/uploads/covers/1_"));
            assertTrue(out.getCoverImageUrl().endsWith(".png"));
            verify(userFileStorage).storeMultipart(eq(f), argThat(rel ->
                    rel != null && rel.startsWith("covers/1_") && rel.endsWith(".png")));
        }

        @Test
        @DisplayName("[Lỗi] Chưa đăng nhập mà upload avatar → UNAUTHORIZED (không gọi storage)")
        void uploadAvatar_unauthenticated_shouldThrow() {
            MockMultipartFile f = new MockMultipartFile("f", "a.png", "image/png", new byte[]{1});
            SlifeException ex = assertThrows(SlifeException.class, () -> service.uploadAvatar(f));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
            verifyNoInteractions(userFileStorage);
        }

        @Test
        @DisplayName("[Lỗi] storeMultipart fails → FILE_UPLOAD_FAILED")
        void ioFailure_shouldThrow() {
            authAsEmail("a@ex.com");
            User u = user(1L, "a@ex.com");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(userFileStorage.storeMultipart(any(), anyString()))
                    .thenThrow(new SlifeException(ErrorCode.FILE_UPLOAD_FAILED));

            MockMultipartFile f = new MockMultipartFile("f", "a.png", "image/png", new byte[]{1,2,3});
            SlifeException ex = assertThrows(SlifeException.class, () -> service.uploadCover(f));
            assertEquals(ErrorCode.FILE_UPLOAD_FAILED, ex.getErrorCode());
        }
    }
}

