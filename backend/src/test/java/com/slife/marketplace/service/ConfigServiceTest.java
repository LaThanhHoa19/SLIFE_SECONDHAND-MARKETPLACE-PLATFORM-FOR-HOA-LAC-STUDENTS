package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.ConfigSingleUpdateRequest;
import com.slife.marketplace.dto.request.ConfigUpdateRequest;
import com.slife.marketplace.dto.response.ConfigResponseDTO;
import com.slife.marketplace.entity.Configuration;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConfigRepository;
import com.slife.marketplace.util.Constants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfigServiceTest {

    @Mock
    private ConfigRepository configRepository;

    @InjectMocks
    private ConfigService configService;

    private User admin;
    private Configuration existing;

    @BeforeEach
    void setUp() {
        admin = new User();
        admin.setId(1L);

        existing = new Configuration();
        existing.setId(10L);
        existing.setConfigName("REPORT_THRESHOLD");
        existing.setConfigValue("5");
        existing.setDescription("Old desc");
        existing.setUpdatedAt(Instant.parse("2025-01-01T00:00:00Z"));
        existing.setDeletedAt(null);
    }

    private static Configuration cfg(String name, String value) {
        Configuration c = new Configuration();
        c.setConfigName(name);
        c.setConfigValue(value);
        return c;
    }

    @Nested
    @DisplayName("Getters (getAllConfigurations/getConfigurationById/getConfigValue*/getIntConfigValue)")
    class Getters {

        @Test
        @DisplayName("getAllConfigurations: map list -> DTO")
        void getAllConfigurations_maps() {
            Configuration c1 = new Configuration();
            c1.setId(1L);
            c1.setConfigName("MAX_IMAGES");
            c1.setConfigValue("10");
            c1.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));

            when(configRepository.findAllByDeletedAtIsNullOrderByUpdatedAtDesc()).thenReturn(List.of(c1));

            List<ConfigResponseDTO> out = configService.getAllConfigurations();
            assertEquals(1, out.size());
            assertEquals("MAX_IMAGES", out.get(0).configKey());
            assertEquals("10", out.get(0).configValue());
        }

        @Test
        @DisplayName("getConfigurationById: tìm thấy -> map DTO")
        void getConfigurationById_found() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            ConfigResponseDTO dto = configService.getConfigurationById(10L);
            assertEquals(10L, dto.id());
            assertEquals("REPORT_THRESHOLD", dto.configKey());
            assertEquals("5", dto.configValue());
        }

        @Test
        @DisplayName("getConfigurationById: không tồn tại -> CONFIGURATION_NOT_FOUND")
        void getConfigurationById_notFound_throws() {
            when(configRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.getConfigurationById(99L));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("getConfigValueByKey: normalize key (trim+uppercase) + not found -> null")
        void getConfigValueByKey_normalizes_andNotFound() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES")).thenReturn(Optional.empty());
            assertNull(configService.getConfigValueByKey("  max_images "));
        }

        @Test
        @DisplayName("getConfigValueByKey: blank key -> INVALID_INPUT")
        void getConfigValueByKey_blankKey_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.getConfigValueByKey("   "));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
            verifyNoInteractions(configRepository);
        }

        @Test
        @DisplayName("getIntConfigValue: value null/blank -> trả default")
        void getIntConfigValue_blank_returnsDefault() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES"))
                    .thenReturn(Optional.of(cfg("MAX_IMAGES", "   ")));

            assertEquals(7, configService.getIntConfigValue("MAX_IMAGES", 7));
        }

        @Test
        @DisplayName("getIntConfigValue: value không phải số -> trả default")
        void getIntConfigValue_nonNumeric_returnsDefault() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES"))
                    .thenReturn(Optional.of(cfg("MAX_IMAGES", "abc")));

            assertEquals(7, configService.getIntConfigValue("MAX_IMAGES", 7));
        }

        @Test
        @DisplayName("getIntConfigValue: value hợp lệ -> parse int")
        void getIntConfigValue_ok_parses() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES"))
                    .thenReturn(Optional.of(cfg("MAX_IMAGES", " 12 ")));

            assertEquals(12, configService.getIntConfigValue("max_images", 7));
        }
    }

    @Nested
    @DisplayName("Xóa cấu hình (deleteConfigurationById)")
    class DeleteById {

        @Test
        @DisplayName("Luồng chính: soft-delete -> set deletedAt + updatedBy")
        void deleteConfigurationById_softDeletes() {
            when(configRepository.findById(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            configService.deleteConfigurationById(10L, admin);

            verify(configRepository, never()).delete(any());
            ArgumentCaptor<Configuration> cap = ArgumentCaptor.forClass(Configuration.class);
            verify(configRepository).save(cap.capture());
            assertNotNull(cap.getValue().getDeletedAt());
            assertEquals(admin, cap.getValue().getUpdatedBy());
        }

        @Test
        @DisplayName("Đã xóa trước đó -> CONFIGURATION_NOT_FOUND")
        void deleteConfigurationById_alreadyDeleted_throws() {
            existing.setDeletedAt(Instant.now());
            when(configRepository.findById(10L)).thenReturn(Optional.of(existing));
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.deleteConfigurationById(10L, admin));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("Không tồn tại -> CONFIGURATION_NOT_FOUND")
        void deleteConfigurationById_notFound_throws() {
            when(configRepository.findById(99L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.deleteConfigurationById(99L, admin));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("Cập nhật 1 cấu hình (updateConfigurationById)")
    class UpdateSingle {

        @Test
        @DisplayName("Luồng chính: update value + description")
        void updateConfigurationById_success() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ConfigResponseDTO dto = configService.updateConfigurationById(
                    10L, new ConfigSingleUpdateRequest("7", "New description"), admin);

            assertEquals("7", dto.configValue());
            assertEquals("New description", dto.description());
        }

        @Test
        @DisplayName("Bỏ description (null) -> giữ nguyên")
        void updateConfigurationById_omitsDescription_preserves() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ConfigResponseDTO dto = configService.updateConfigurationById(
                    10L, new ConfigSingleUpdateRequest("8", null), admin);

            assertEquals("8", dto.configValue());
            assertEquals("Old desc", dto.description());
        }

        @Test
        @DisplayName("Không tồn tại -> CONFIGURATION_NOT_FOUND")
        void updateConfigurationById_notFound_throws() {
            when(configRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(99L, new ConfigSingleUpdateRequest("1", null), admin));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Key numeric nhưng value không phải số -> INVALID_INPUT")
        void updateConfigurationById_invalidNumeric_throws() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(10L, new ConfigSingleUpdateRequest("x", null), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Key numeric nhưng value vượt range -> INVALID_INPUT")
        void updateConfigurationById_outOfRange_throws() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            // REPORT_THRESHOLD valid range 1..100
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(10L, new ConfigSingleUpdateRequest("101", null), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("Cập nhật nhiều cấu hình (updateConfigurations)")
    class UpdateBulk {

        @Test
        @DisplayName("Danh sách null/empty -> INVALID_INPUT")
        void updateConfigurations_empty_shouldThrow() {
            SlifeException ex1 = assertThrows(SlifeException.class, () -> configService.updateConfigurations(null, admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());

            SlifeException ex2 = assertThrows(SlifeException.class, () -> configService.updateConfigurations(List.of(), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
        }

        @Test
        @DisplayName("Key trùng (case-insensitive) -> INVALID_INPUT")
        void updateConfigurations_duplicateKeys_shouldThrow() {
            List<ConfigUpdateRequest> reqs = new ArrayList<>();
            reqs.add(new ConfigUpdateRequest("max_images", "10", null));
            reqs.add(new ConfigUpdateRequest("MAX_IMAGES", "11", null));
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.updateConfigurations(reqs, admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Key blank hoặc value blank -> INVALID_INPUT")
        void updateConfigurations_invalidKeyOrValue_shouldThrow() {
            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurations(List.of(new ConfigUpdateRequest("   ", "1", null)), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());

            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurations(List.of(new ConfigUpdateRequest("MAX_IMAGES", "   ", null)), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
        }

        @Test
        @DisplayName("Tạo mới: set description khi tạo")
        void updateConfigurations_bulk_setsDescriptionOnCreate() {
            when(configRepository.findByConfigNameInAndDeletedAtIsNull(List.of("NEW_KEY"))).thenReturn(List.of());
            when(configRepository.findByConfigName("NEW_KEY")).thenReturn(Optional.empty());
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            String msg = configService.updateConfigurations(
                    List.of(new ConfigUpdateRequest("NEW_KEY", "hello", "Bulk desc")), admin);
            assertEquals(Constants.MSG19, msg);

            ArgumentCaptor<Configuration> cap = ArgumentCaptor.forClass(Configuration.class);
            verify(configRepository).save(cap.capture());
            assertEquals("NEW_KEY", cap.getValue().getConfigName());
            assertEquals("hello", cap.getValue().getConfigValue());
            assertEquals("Bulk desc", cap.getValue().getDescription());
            assertNull(cap.getValue().getDeletedAt());
        }

        @Test
        @DisplayName("Khôi phục soft-deleted -> deletedAt=null")
        void updateConfigurations_bulk_restoresSoftDeleted() {
            Configuration dead = new Configuration();
            dead.setId(3L);
            dead.setConfigName("OLD_KEY");
            dead.setConfigValue("0");
            dead.setDeletedAt(Instant.parse("2024-06-01T00:00:00Z"));

            when(configRepository.findByConfigNameInAndDeletedAtIsNull(List.of("OLD_KEY"))).thenReturn(List.of());
            when(configRepository.findByConfigName("OLD_KEY")).thenReturn(Optional.of(dead));
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            configService.updateConfigurations(
                    List.of(new ConfigUpdateRequest("OLD_KEY", "99", null)), admin);

            ArgumentCaptor<Configuration> cap = ArgumentCaptor.forClass(Configuration.class);
            verify(configRepository).save(cap.capture());
            assertNull(cap.getValue().getDeletedAt());
            assertEquals("99", cap.getValue().getConfigValue());
        }

        @Test
        @DisplayName("Description blank -> trimToNull -> null")
        void updateConfigurations_blankDescription_shouldBecomeNull() {
            when(configRepository.findByConfigNameInAndDeletedAtIsNull(List.of("NEW_KEY"))).thenReturn(List.of());
            when(configRepository.findByConfigName("NEW_KEY")).thenReturn(Optional.empty());
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            configService.updateConfigurations(
                    List.of(new ConfigUpdateRequest("NEW_KEY", "hello", "   ")), admin);

            ArgumentCaptor<Configuration> cap = ArgumentCaptor.forClass(Configuration.class);
            verify(configRepository).save(cap.capture());
            assertNull(cap.getValue().getDescription());
        }
    }
}
