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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserFileStorageService userFileStorage;

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
        u.setFullName("User " + id);
        return u;
    }

    private static void authAsEmail(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "pw", List.of())
        );
    }

    private static void authAsUserDetails(String email) {
        UserDetails principal = new org.springframework.security.core.userdetails.User(
                email,
                "pw",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pw", principal.getAuthorities())
        );
    }

    @Nested
    @DisplayName("Function: getCurrentUserEmail")
    class GetCurrentUserEmailGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - auth null -> UNAUTHORIZED")
        void utcId01_shouldThrowUnauthorized_whenAuthIsMissing() {
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getCurrentUserEmail());
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - principal String valid -> return email")
        void utcId02_shouldReturnEmail_whenPrincipalIsString() {
            authAsEmail("student@slife.vn");
            String email = service.getCurrentUserEmail();
            assertEquals("student@slife.vn", email);
        }

        @Test
        @DisplayName("UTCID03 [Positive] - principal UserDetails valid -> return username")
        void utcId03_shouldReturnUsername_whenPrincipalIsUserDetails() {
            authAsUserDetails("detail@slife.vn");
            String email = service.getCurrentUserEmail();
            assertEquals("detail@slife.vn", email);
        }

        @Test
        @DisplayName("UTCID04 [Negative] - principal blank -> UNAUTHORIZED")
        void utcId04_shouldThrowUnauthorized_whenPrincipalBlank() {
            authAsEmail(" ");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getCurrentUserEmail());
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("Function: markPhoneVerifiedWithFirebase")
    class MarkPhoneVerifiedWithFirebaseGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - save and reload success")
        void utcId01_shouldSetPhoneAndVerifiedAt_whenFlowSuccess() {
            authAsEmail("verify@slife.vn");
            User current = user(1L, "verify@slife.vn");
            when(userRepository.findByEmail("verify@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.findByIdNotAndPhoneNumberIsNotNull(1L)).thenReturn(List.of());
            when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById(1L)).thenReturn(Optional.of(current));

            User result = service.markPhoneVerifiedWithFirebase("+84901234567");

            assertEquals("+84901234567", result.getPhoneNumber());
            assertNotNull(result.getPhoneVerifiedAt());
            verify(userRepository).saveAndFlush(current);
        }

        @Test
        @DisplayName("UTCID02 [Negative] - duplicated phone with other account")
        void utcId02_shouldThrowPhoneAlreadyInUse_whenAnotherAccountUsesSamePhone() {
            authAsEmail("verify@slife.vn");
            User current = user(1L, "verify@slife.vn");
            User other = user(2L, "other@slife.vn");
            other.setPhoneNumber("0901234567");

            when(userRepository.findByEmail("verify@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.findByIdNotAndPhoneNumberIsNotNull(1L)).thenReturn(List.of(other));

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> service.markPhoneVerifiedWithFirebase("+84901234567")
            );
            assertEquals(ErrorCode.PHONE_ALREADY_IN_USE, ex.getErrorCode());
            verify(userRepository, never()).saveAndFlush(any(User.class));
        }

        @Test
        @DisplayName("UTCID03 [Negative] - reload missing after save -> INTERNAL_ERROR")
        void utcId03_shouldThrowInternalError_whenReloadMissing() {
            authAsEmail("verify@slife.vn");
            User current = user(1L, "verify@slife.vn");

            when(userRepository.findByEmail("verify@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.findByIdNotAndPhoneNumberIsNotNull(1L)).thenReturn(List.of());
            when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> service.markPhoneVerifiedWithFirebase("+84901234567")
            );
            assertEquals(ErrorCode.INTERNAL_ERROR, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("Function: updateCurrentUser")
    class UpdateCurrentUserGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - request null fallback fullName")
        void utcId01_shouldFallbackFullName_whenRequestNull() {
            authAsEmail("profile@slife.vn");
            User current = user(1L, "profile@slife.vn");
            current.setFullName("  ");
            when(userRepository.findByEmail("profile@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = service.updateCurrentUser(null);

            assertEquals("profile@slife.vn", result.getFullName());
            assertNotNull(result.getUpdatedAt());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - same phone subscriber keeps phoneVerifiedAt")
        void utcId02_shouldKeepPhoneVerifiedAt_whenSubscriberIsSame() {
            authAsEmail("profile@slife.vn");
            User current = user(1L, "profile@slife.vn");
            current.setPhoneNumber("+84901234567");
            current.setPhoneVerifiedAt(LocalDateTime.now());
            when(userRepository.findByEmail("profile@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateUserRequest req = new UpdateUserRequest();
            req.setPhoneNumber("0901234567");
            User result = service.updateCurrentUser(req);

            assertNotNull(result.getPhoneVerifiedAt());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - changed phone clears phoneVerifiedAt")
        void utcId03_shouldClearPhoneVerifiedAt_whenPhoneChanged() {
            authAsEmail("profile@slife.vn");
            User current = user(1L, "profile@slife.vn");
            current.setPhoneNumber("+84901234567");
            current.setPhoneVerifiedAt(LocalDateTime.now());
            when(userRepository.findByEmail("profile@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateUserRequest req = new UpdateUserRequest();
            req.setPhoneNumber("0909999999");
            User result = service.updateCurrentUser(req);

            assertNull(result.getPhoneVerifiedAt());
        }

        @Test
        @DisplayName("UTCID04 [Boundary] - blank profile fields become null")
        void utcId04_shouldNormalizeBlankFieldsToNull() {
            authAsEmail("profile@slife.vn");
            User current = user(1L, "profile@slife.vn");
            when(userRepository.findByEmail("profile@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateUserRequest req = new UpdateUserRequest();
            req.setBio("   ");
            req.setAvatarUrl(" ");
            req.setCoverImageUrl(" ");
            User result = service.updateCurrentUser(req);

            assertNull(result.getBio());
            assertNull(result.getAvatarUrl());
            assertNull(result.getCoverImageUrl());
        }
    }

    @Nested
    @DisplayName("Function: uploadAvatar")
    class UploadAvatarGroup {
        @Test
        @DisplayName("UTCID01 [Negative] - null or empty file -> INVALID_INPUT")
        void utcId01_shouldThrowInvalidInput_whenFileNullOrEmpty() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> service.uploadAvatar(null)).getErrorCode());
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class,
                            () -> service.uploadAvatar(new MockMultipartFile("f", "a.png", "image/png", new byte[0])))
                            .getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Boundary] - file too large -> INVALID_INPUT")
        void utcId02_shouldThrowInvalidInput_whenFileTooLarge() {
            byte[] big = new byte[5 * 1024 * 1024 + 1];
            MockMultipartFile file = new MockMultipartFile("f", "a.png", "image/png", big);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.uploadAvatar(file));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - unauthenticated user -> UNAUTHORIZED")
        void utcId03_shouldThrowUnauthorized_whenUnauthenticated() {
            MockMultipartFile file = new MockMultipartFile("f", "a.png", "image/png", new byte[]{1, 2});
            SlifeException ex = assertThrows(SlifeException.class, () -> service.uploadAvatar(file));

            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
            verifyNoInteractions(userFileStorage);
        }

        @Test
        @DisplayName("UTCID04 [Positive] - valid file stores avatar and persists URL")
        void utcId04_shouldStoreAndPersistAvatar_whenValidRequest() {
            authAsEmail("avatar@slife.vn");
            User current = user(1L, "avatar@slife.vn");
            when(userRepository.findByEmail("avatar@slife.vn")).thenReturn(Optional.of(current));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userFileStorage.storeMultipart(any(), anyString()))
                    .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

            MockMultipartFile file = new MockMultipartFile("f", "avatar.JPEG", "image/jpeg", new byte[]{1, 2, 3});
            User result = service.uploadAvatar(file);

            assertNotNull(result.getAvatarUrl());
            assertTrue(result.getAvatarUrl().startsWith("/uploads/avatars/1_"));
            assertTrue(result.getAvatarUrl().endsWith(".jpeg"));
            assertNotNull(result.getUpdatedAt());
            verify(userFileStorage).storeMultipart(eq(file), argThat((String rel) ->
                    rel != null && rel.startsWith("avatars/1_") && rel.endsWith(".jpeg")));
            verify(userRepository).save(current);
        }
    }
}

