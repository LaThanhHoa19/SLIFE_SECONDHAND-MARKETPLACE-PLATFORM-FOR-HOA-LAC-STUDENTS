package com.slife.marketplace.service;

import com.slife.marketplace.config.CacheConfig;
import com.slife.marketplace.dto.request.ConfigSingleUpdateRequest;
import com.slife.marketplace.dto.request.ConfigUpdateRequest;
import com.slife.marketplace.dto.response.ConfigResponseDTO;
import com.slife.marketplace.dto.response.ConfigValidationMetaDTO;
import com.slife.marketplace.entity.Configuration;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConfigRepository;
import com.slife.marketplace.util.Constants;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ConfigService {

    private static final Set<String> NUMERIC_CONFIG_KEYS = Set.of(
            "MAX_IMAGES",
            "LISTING_EXPIRATION",
            "MAX_IMAGES_PER_POST",
            "DEAL_TIMEOUT_DAYS",
            "REPORT_THRESHOLD",
            "AUTO_HIDE_REPORT_THRESHOLD");

    private static final Map<String, ConfigValidationMetaDTO> VALIDATION_RULES = Map.of(
            "LISTING_EXPIRATION", new ConfigValidationMetaDTO("integer", 1, 365, "Giá trị hợp lệ: 1–365 ngày."),
            "MAX_IMAGES", new ConfigValidationMetaDTO("integer", 1, 30, "Giá trị hợp lệ: 1–30 ảnh."),
            "MAX_IMAGES_PER_POST", new ConfigValidationMetaDTO("integer", 1, 30, "Giá trị hợp lệ: 1–30 ảnh."),
            "REPORT_THRESHOLD", new ConfigValidationMetaDTO("integer", 1, 100, "Giá trị hợp lệ: 1–100."),
            "DEAL_TIMEOUT_DAYS", new ConfigValidationMetaDTO("integer", 1, 365, "Giá trị hợp lệ: 1–365 ngày."),
            "AUTO_HIDE_REPORT_THRESHOLD", new ConfigValidationMetaDTO("integer", 1, 100, "Giá trị hợp lệ: 1–100."));
    private final ConfigRepository configRepository;

    public ConfigService(ConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    @Transactional(readOnly = true)
    public List<ConfigResponseDTO> getAllConfigurations() {
        return configRepository.findAllByDeletedAtIsNullOrderByUpdatedAtDesc()
                .stream()
                .map(this::toConfigResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConfigResponseDTO getConfigurationById(Long id) {
        return configRepository.findByIdAndDeletedAtIsNull(id)
                .map(this::toConfigResponseDTO)
                .orElseThrow(() -> new SlifeException(ErrorCode.CONFIGURATION_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.CONFIG_VALUE_CACHE, key = "#key.trim().toUpperCase()")
    public String getConfigValue(String key) {
        String normalizedKey = normalizeKey(key);
        return configRepository.findByConfigNameAndDeletedAtIsNull(normalizedKey)
                .map(Configuration::getConfigValue)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.CONFIG_VALUE_CACHE, key = "#key.trim().toUpperCase()")
    public String getConfigValueByKey(String key) {
        String normalizedKey = normalizeKey(key);
        return configRepository.findByConfigNameAndDeletedAtIsNull(normalizedKey)
                .map(Configuration::getConfigValue)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public int getIntConfigValue(String key, int defaultValue) {
        String raw = getConfigValueByKey(key);
        if (raw == null || raw.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.CONFIG_VALUE_CACHE, allEntries = true)
    public String updateConfigurations(List<ConfigUpdateRequest> requests, User admin) {
        if (requests == null || requests.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "configuration list must not be empty");
        }

        Map<String, ConfigUpdateRequest> byNormalizedKey = new java.util.LinkedHashMap<>();
        Set<String> duplicateKeys = new HashSet<>();
        for (ConfigUpdateRequest request : requests) {
            String key = normalizeKey(request.key());
            String value = normalizeValue(request.value());
            validateValueFormat(key, value);
            if (byNormalizedKey.putIfAbsent(key, request) != null) {
                duplicateKeys.add(key);
            }
        }
        if (!duplicateKeys.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "configKey must be unique");
        }

        List<String> keys = byNormalizedKey.keySet().stream().toList();
        Map<String, Configuration> existingActive = configRepository.findByConfigNameInAndDeletedAtIsNull(keys)
                .stream()
                .collect(java.util.stream.Collectors.toMap(Configuration::getConfigName, c -> c));

        Instant now = Instant.now();
        for (Map.Entry<String, ConfigUpdateRequest> entry : byNormalizedKey.entrySet()) {
            String configKey = entry.getKey();
            ConfigUpdateRequest req = entry.getValue();
            Configuration configuration = existingActive.get(configKey);
            if (configuration == null) {
                configuration = configRepository.findByConfigName(configKey).orElse(null);
                if (configuration != null) {
                    configuration.setDeletedAt(null);
                    if (req.description() != null) {
                        configuration.setDescription(trimDescriptionToNull(req.description()));
                    }
                } else {
                    configuration = new Configuration();
                    configuration.setConfigName(configKey);
                    configuration.setDescription(trimDescriptionToNull(req.description()));
                }
            } else {
                if (req.description() != null) {
                    configuration.setDescription(trimDescriptionToNull(req.description()));
                }
            }

            configuration.setConfigValue(normalizeValue(req.value()));
            configuration.setUpdatedBy(admin);
            configuration.setUpdatedAt(now);
            configRepository.save(configuration);
        }

        return Constants.MSG19;
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.CONFIG_VALUE_CACHE, allEntries = true)
    public ConfigResponseDTO updateConfigurationById(Long id, ConfigSingleUpdateRequest request, User admin) {
        Configuration configuration = configRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.CONFIGURATION_NOT_FOUND));
        String key = configuration.getConfigName();
        String value = normalizeValue(request.value());
        validateValueFormat(key, value);
        configuration.setConfigValue(value);
        if (request.description() != null) {
            configuration.setDescription(trimDescriptionToNull(request.description()));
        }
        configuration.setUpdatedBy(admin);
        configuration.setUpdatedAt(Instant.now());
        return toConfigResponseDTO(configRepository.save(configuration));
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.CONFIG_VALUE_CACHE, allEntries = true)
    public void deleteConfigurationById(Long id, User admin) {
        Configuration configuration = configRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.CONFIGURATION_NOT_FOUND));
        if (configuration.getDeletedAt() != null) {
            throw new SlifeException(ErrorCode.CONFIGURATION_NOT_FOUND);
        }
        configuration.setDeletedAt(Instant.now());
        configuration.setUpdatedAt(Instant.now());
        configuration.setUpdatedBy(admin);
        configRepository.save(configuration);
    }

    private ConfigResponseDTO toConfigResponseDTO(Configuration configuration) {
        return new ConfigResponseDTO(
                configuration.getId(),
                configuration.getConfigName(),
                configuration.getConfigValue(),
                configuration.getDescription(),
                configuration.getUpdatedAt());
    }

    private String normalizeKey(String key) {
        if (key == null || key.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "key is required");
        }
        return key.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeValue(String value) {
        if (value == null || value.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "value must not be blank");
        }
        return value.trim();
    }

    private void validateValueFormat(String key, String value) {
        if (!NUMERIC_CONFIG_KEYS.contains(key)) {
            return;
        }

        final int parsed;
        try {
            parsed = Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, key + " must be a valid number");
        }

        ConfigValidationMetaDTO meta = VALIDATION_RULES.get(key);
        if (meta == null) {
            return;
        }

        Integer min = meta.min();
        Integer max = meta.max();
        if ((min != null && parsed < min) || (max != null && parsed > max)) {
            String hint = meta.hint();
            if (hint != null && !hint.isBlank()) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, hint);
            }
            throw new SlifeException(ErrorCode.INVALID_INPUT, key + " is out of valid range");
        }
    }

    /** Chuỗi rỗng → null; giữ nguyên nội dung có ý nghĩa (LOB trên entity). */
    private static String trimDescriptionToNull(String description) {
        if (description == null) {
            return null;
        }
        String t = description.trim();
        return t.isEmpty() ? null : t;
    }
}