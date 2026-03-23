package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.ConfigUpdateRequest;
import com.slife.marketplace.dto.response.ConfigResponseDTO;
import com.slife.marketplace.entity.Configuration;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConfigRepository;
import com.slife.marketplace.util.Constants;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ConfigService {

    private static final Set<String> NUMERIC_CONFIG_KEYS = Set.of("MAX_IMAGES", "LISTING_EXPIRATION");
    private final ConfigRepository configRepository;

    public ConfigService(ConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    @Transactional(readOnly = true)
    public List<ConfigResponseDTO> getAllConfigurations() {
        return configRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toConfigResponseDTO)
                .toList();
    }

    @Transactional
    public String updateConfigurations(List<ConfigUpdateRequest> requests, User admin) {
        if (requests == null || requests.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "configuration list must not be empty");
        }

        Map<String, String> normalizedInput = new HashMap<>();
        Set<String> duplicateKeys = new HashSet<>();
        for (ConfigUpdateRequest request : requests) {
            String key = normalizeKey(request.key());
            String value = normalizeValue(request.value());
            validateValueFormat(key, value);
            if (normalizedInput.putIfAbsent(key, value) != null) {
                duplicateKeys.add(key);
            }
        }
        if (!duplicateKeys.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "configKey must be unique");
        }

        List<String> keys = normalizedInput.keySet().stream().toList();
        Map<String, Configuration> existing = configRepository.findByConfigNameIn(keys)
                .stream()
                .collect(java.util.stream.Collectors.toMap(Configuration::getConfigName, c -> c));

        Instant now = Instant.now();
        for (Map.Entry<String, String> entry : normalizedInput.entrySet()) {
            Configuration configuration = existing.get(entry.getKey());
            if (configuration == null) {
                configuration = new Configuration();
                configuration.setConfigName(entry.getKey());
                configuration.setDescription(null);
            }

            configuration.setConfigValue(entry.getValue());
            configuration.setUpdatedBy(admin);
            configuration.setUpdatedAt(now);
            configRepository.save(configuration);
        }

        return Constants.MSG19;
    }

    private ConfigResponseDTO toConfigResponseDTO(Configuration configuration) {
        return new ConfigResponseDTO(
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
        try {
            Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, key + " must be a valid number");
        }
    }
}