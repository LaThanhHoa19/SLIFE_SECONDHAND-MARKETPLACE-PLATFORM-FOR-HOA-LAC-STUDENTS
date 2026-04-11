package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.ConfigSingleUpdateRequest;
import com.slife.marketplace.dto.request.ConfigUpdateRequest;
import com.slife.marketplace.dto.response.ConfigResponseDTO;
import com.slife.marketplace.entity.Configuration;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

    @Test
    void getConfigurationById_found() {
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
        ConfigResponseDTO dto = configService.getConfigurationById(10L);
        assertEquals(10L, dto.id());
        assertEquals("REPORT_THRESHOLD", dto.configKey());
        assertEquals("5", dto.configValue());
    }

    @Test
    void getConfigurationById_notFound_throws() {
        when(configRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());
        SlifeException ex = assertThrows(SlifeException.class, () -> configService.getConfigurationById(99L));
        assertEquals(ErrorCode.CONFIGURATION_NOT_FOUND, ex.getErrorCode());
    }

    @Test
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
    void deleteConfigurationById_alreadyDeleted_throws() {
        existing.setDeletedAt(Instant.now());
        when(configRepository.findById(10L)).thenReturn(Optional.of(existing));
        assertThrows(SlifeException.class, () -> configService.deleteConfigurationById(10L, admin));
        verify(configRepository, never()).save(any());
    }

    @Test
    void deleteConfigurationById_notFound_throws() {
        when(configRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(SlifeException.class, () -> configService.deleteConfigurationById(99L, admin));
    }

    @Test
    void updateConfigurationById_success() {
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
        when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ConfigResponseDTO dto = configService.updateConfigurationById(
                10L, new ConfigSingleUpdateRequest("7", "New description"), admin);

        assertEquals("7", dto.configValue());
        assertEquals("New description", dto.description());
    }

    @Test
    void updateConfigurationById_omitsDescription_preserves() {
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
        when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ConfigResponseDTO dto = configService.updateConfigurationById(
                10L, new ConfigSingleUpdateRequest("8", null), admin);

        assertEquals("8", dto.configValue());
        assertEquals("Old desc", dto.description());
    }

    @Test
    void updateConfigurationById_invalidNumeric_throws() {
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
        assertThrows(SlifeException.class,
                () -> configService.updateConfigurationById(10L, new ConfigSingleUpdateRequest("x", null), admin));
    }

    @Test
    void updateConfigurations_bulk_setsDescriptionOnCreate() {
        when(configRepository.findByConfigNameInAndDeletedAtIsNull(List.of("NEW_KEY"))).thenReturn(List.of());
        when(configRepository.findByConfigName("NEW_KEY")).thenReturn(Optional.empty());
        when(configRepository.save(any(Configuration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        configService.updateConfigurations(
                List.of(new ConfigUpdateRequest("NEW_KEY", "hello", "Bulk desc")), admin);

        ArgumentCaptor<Configuration> cap = ArgumentCaptor.forClass(Configuration.class);
        verify(configRepository).save(cap.capture());
        assertEquals("NEW_KEY", cap.getValue().getConfigName());
        assertEquals("hello", cap.getValue().getConfigValue());
        assertEquals("Bulk desc", cap.getValue().getDescription());
        assertNull(cap.getValue().getDeletedAt());
    }

    @Test
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

    // ── ENUM unit config tests (DEAL_TIMEOUT_UNIT, REVIEW_TIMEOUT_UNIT) ─────────

    @Test
    void updateConfigurationById_dealTimeoutUnit_DAYS_accepted() {
        existing.setConfigName("DEAL_TIMEOUT_UNIT");
        existing.setConfigValue("DAYS");
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
        when(configRepository.save(any(Configuration.class))).thenAnswer(inv -> inv.getArgument(0));

        ConfigResponseDTO dto = configService.updateConfigurationById(
                10L, new ConfigSingleUpdateRequest("DAYS", null), admin);
        assertEquals("DAYS", dto.configValue());
    }

    @Test
    void updateConfigurationById_dealTimeoutUnit_MINUTES_accepted() {
        existing.setConfigName("DEAL_TIMEOUT_UNIT");
        existing.setConfigValue("DAYS");
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
        when(configRepository.save(any(Configuration.class))).thenAnswer(inv -> inv.getArgument(0));

        ConfigResponseDTO dto = configService.updateConfigurationById(
                10L, new ConfigSingleUpdateRequest("MINUTES", null), admin);
        assertEquals("MINUTES", dto.configValue());
    }

    @Test
    void updateConfigurationById_dealTimeoutUnit_invalidEnum_throws() {
        existing.setConfigName("DEAL_TIMEOUT_UNIT");
        existing.setConfigValue("DAYS");
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));

        SlifeException ex = assertThrows(SlifeException.class,
                () -> configService.updateConfigurationById(
                        10L, new ConfigSingleUpdateRequest("HOURS", null), admin));
        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    void updateConfigurationById_reviewTimeoutValue_numericRange() {
        existing.setConfigName("REVIEW_TIMEOUT_VALUE");
        existing.setConfigValue("7");
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));

        // value 0 is below min=1 → throws
        assertThrows(SlifeException.class,
                () -> configService.updateConfigurationById(
                        10L, new ConfigSingleUpdateRequest("0", null), admin));
    }

    @Test
    void updateConfigurationById_reviewTimeoutUnit_MINUTES_accepted() {
        existing.setConfigName("REVIEW_TIMEOUT_UNIT");
        existing.setConfigValue("DAYS");
        when(configRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(existing));
        when(configRepository.save(any(Configuration.class))).thenAnswer(inv -> inv.getArgument(0));

        ConfigResponseDTO dto = configService.updateConfigurationById(
                10L, new ConfigSingleUpdateRequest("MINUTES", null), admin);
        assertEquals("MINUTES", dto.configValue());
    }
}
