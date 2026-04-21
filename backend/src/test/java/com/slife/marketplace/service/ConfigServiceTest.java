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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    @DisplayName("Function: getAllConfigurations")
    class GetAllConfigurationsGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - có cấu hình đang hoạt động → trả danh sách DTO")
        void utcId01_shouldMapActiveConfigurations() {
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
        @DisplayName("UTCID02 [Positive] - chưa có dòng cấu hình nào → danh sách rỗng")
        void utcId02_shouldReturnEmpty_whenNoRows() {
            when(configRepository.findAllByDeletedAtIsNullOrderByUpdatedAtDesc()).thenReturn(List.of());

            List<ConfigResponseDTO> out = configService.getAllConfigurations();
            assertEquals(0, out.size());
        }
    }

    @Nested
    @DisplayName("Function: getConfigurationById")
    class GetConfigurationByIdGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - admin mở chi tiết đúng id còn hiệu lực")
        void utcId01_shouldReturnDto_whenFound() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));

            ConfigResponseDTO dto = configService.getConfigurationById(10L);
            assertEquals(10L, dto.id());
            assertEquals("REPORT_THRESHOLD", dto.configKey());
            assertEquals("5", dto.configValue());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - id không tồn tại hoặc đã xóa mềm")
        void utcId02_shouldThrow_whenNotFound() {
            when(configRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> configService.getConfigurationById(99L));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("Function: getConfigValueByKey")
    class GetConfigValueByKeyGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - tìm theo tên key có khoảng trắng và chữ thường")
        void utcId01_shouldNormalizeKeyAndReturnValue() {
            Configuration row = cfg("MAX_IMAGES", "10");
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES")).thenReturn(Optional.of(row));

            assertEquals("10", configService.getConfigValueByKey("  max_images "));
        }

        @Test
        @DisplayName("UTCID02 [Positive] - key hợp lệ nhưng không có bản ghi chưa xóa")
        void utcId02_shouldReturnNull_whenNotFound() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES")).thenReturn(Optional.empty());

            assertNull(configService.getConfigValueByKey("  max_images "));
        }

        @Test
        @DisplayName("UTCID03 [Negative] - key để trống / chỉ khoảng trắng")
        void utcId03_shouldThrow_whenKeyBlank() {
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.getConfigValueByKey("   "));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
            verifyNoInteractions(configRepository);
        }
    }

    @Nested
    @DisplayName("Function: getIntConfigValue")
    class GetIntConfigValueGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - giá trị trong DB trống hoặc chỉ khoảng trắng → dùng mặc định")
        void utcId01_shouldReturnDefault_whenBlankStored() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES"))
                    .thenReturn(Optional.of(cfg("MAX_IMAGES", "   ")));

            assertEquals(7, configService.getIntConfigValue("MAX_IMAGES", 7));
        }

        @Test
        @DisplayName("UTCID02 [Positive] - giá trị không parse được số → dùng mặc định")
        void utcId02_shouldReturnDefault_whenNonNumeric() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES"))
                    .thenReturn(Optional.of(cfg("MAX_IMAGES", "abc")));

            assertEquals(7, configService.getIntConfigValue("MAX_IMAGES", 7));
        }

        @Test
        @DisplayName("UTCID03 [Positive] - chuỗi số có khoảng trắng → parse đúng")
        void utcId03_shouldParse_whenValidIntegerString() {
            when(configRepository.findByConfigNameAndDeletedAtIsNull("MAX_IMAGES"))
                    .thenReturn(Optional.of(cfg("MAX_IMAGES", " 12 ")));

            assertEquals(12, configService.getIntConfigValue("max_images", 7));
        }
    }

    @Nested
    @DisplayName("Function: deleteConfigurationById")
    class DeleteConfigurationByIdGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - cấu hình đang dùng được đánh dấu xóa mềm")
        void utcId01_shouldSoftDelete_whenActive() {
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
        @DisplayName("UTCID02 [Negative] - bản ghi đã xóa mềm trước đó")
        void utcId02_shouldThrow_whenAlreadyDeleted() {
            existing.setDeletedAt(Instant.now());
            when(configRepository.findById(10L)).thenReturn(Optional.of(existing));

            SlifeException ex = assertThrows(SlifeException.class, () -> configService.deleteConfigurationById(10L, admin));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - id không tồn tại")
        void utcId03_shouldThrow_whenIdMissing() {
            when(configRepository.findById(99L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> configService.deleteConfigurationById(99L, admin));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("Function: updateConfigurationById")
    class UpdateConfigurationByIdGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - đổi giá trị và mô tả cùng lúc")
        void utcId01_shouldUpdateValueAndDescription() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ConfigResponseDTO dto = configService.updateConfigurationById(
                    10L, new ConfigSingleUpdateRequest("7", "New description"), admin);

            assertEquals("7", dto.configValue());
            assertEquals("New description", dto.description());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - không gửi mô tả mới → giữ mô tả cũ")
        void utcId02_shouldPreserveDescription_whenNullInRequest() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ConfigResponseDTO dto = configService.updateConfigurationById(
                    10L, new ConfigSingleUpdateRequest("8", null), admin);

            assertEquals("8", dto.configValue());
            assertEquals("Old desc", dto.description());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - id không còn bản ghi active")
        void utcId03_shouldThrow_whenNotFound() {
            when(configRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(99L, new ConfigSingleUpdateRequest("1", null), admin));
            assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - key dạng số nhưng giá trị không phải số")
        void utcId04_shouldThrow_whenNumericKeyInvalidFormat() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(10L, new ConfigSingleUpdateRequest("x", null), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID05 [Negative] - key số vượt ngưỡng cho phép")
        void utcId05_shouldThrow_whenOutOfRange() {
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(10L, new ConfigSingleUpdateRequest("101", null), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID06 [Positive] - DEAL_TIMEOUT_UNIT = DAYS")
        void utcId06_shouldAcceptDealTimeoutUnitDays() {
            existing.setConfigName("DEAL_TIMEOUT_UNIT");
            existing.setConfigValue("DAYS");
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(inv -> inv.getArgument(0));

            ConfigResponseDTO dto = configService.updateConfigurationById(
                    10L, new ConfigSingleUpdateRequest("DAYS", null), admin);
            assertEquals("DAYS", dto.configValue());
        }

        @Test
        @DisplayName("UTCID07 [Positive] - DEAL_TIMEOUT_UNIT = MINUTES")
        void utcId07_shouldAcceptDealTimeoutUnitMinutes() {
            existing.setConfigName("DEAL_TIMEOUT_UNIT");
            existing.setConfigValue("DAYS");
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(inv -> inv.getArgument(0));

            ConfigResponseDTO dto = configService.updateConfigurationById(
                    10L, new ConfigSingleUpdateRequest("MINUTES", null), admin);
            assertEquals("MINUTES", dto.configValue());
        }

        @Test
        @DisplayName("UTCID08 [Negative] - DEAL_TIMEOUT_UNIT không phải DAYS/MINUTES")
        void utcId08_shouldThrow_whenDealTimeoutUnitInvalid() {
            existing.setConfigName("DEAL_TIMEOUT_UNIT");
            existing.setConfigValue("DAYS");
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(
                            10L, new ConfigSingleUpdateRequest("HOURS", null), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID09 [Negative] - REVIEW_TIMEOUT_VALUE dưới min")
        void utcId09_shouldThrow_whenReviewTimeoutValueBelowMin() {
            existing.setConfigName("REVIEW_TIMEOUT_VALUE");
            existing.setConfigValue("7");
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurationById(
                            10L, new ConfigSingleUpdateRequest("0", null), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID10 [Positive] - REVIEW_TIMEOUT_UNIT = MINUTES")
        void utcId10_shouldAcceptReviewTimeoutUnitMinutes() {
            existing.setConfigName("REVIEW_TIMEOUT_UNIT");
            existing.setConfigValue("DAYS");
            when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
            when(configRepository.save(any(Configuration.class))).thenAnswer(inv -> inv.getArgument(0));

            ConfigResponseDTO dto = configService.updateConfigurationById(
                    10L, new ConfigSingleUpdateRequest("MINUTES", null), admin);
            assertEquals("MINUTES", dto.configValue());
        }
    }

    @Nested
    @DisplayName("Function: updateConfigurations")
    class UpdateConfigurationsGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - danh sách null")
        void utcId01_shouldThrow_whenListNull() {
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.updateConfigurations(null, admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - danh sách rỗng")
        void utcId02_shouldThrow_whenListEmpty() {
            SlifeException ex = assertThrows(SlifeException.class, () -> configService.updateConfigurations(List.of(), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - trùng key sau khi chuẩn hóa")
        void utcId03_shouldThrow_whenDuplicateKeys() {
            List<ConfigUpdateRequest> reqs = new ArrayList<>();
            reqs.add(new ConfigUpdateRequest("max_images", "10", null));
            reqs.add(new ConfigUpdateRequest("MAX_IMAGES", "11", null));

            SlifeException ex = assertThrows(SlifeException.class, () -> configService.updateConfigurations(reqs, admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - key chỉ có khoảng trắng")
        void utcId04_shouldThrow_whenKeyBlank() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurations(List.of(new ConfigUpdateRequest("   ", "1", null)), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID05 [Negative] - value để trống")
        void utcId05_shouldThrow_whenValueBlank() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> configService.updateConfigurations(List.of(new ConfigUpdateRequest("MAX_IMAGES", "   ", null)), admin));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID06 [Positive] - key mới chưa có trong hệ thống → tạo bản ghi")
        void utcId06_shouldCreate_whenNewKey() {
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
        @DisplayName("UTCID07 [Positive] - key từng bị xóa mềm → khôi phục và cập nhật giá trị")
        void utcId07_shouldRestoreSoftDeleted() {
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
        @DisplayName("UTCID08 [Positive] - mô tả chỉ khoảng trắng → lưu null")
        void utcId08_shouldTrimBlankDescriptionToNull() {
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
