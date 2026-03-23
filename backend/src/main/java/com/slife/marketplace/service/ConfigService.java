package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ConfigResponseDTO;
import com.slife.marketplace.entity.Configuration;
import com.slife.marketplace.repository.ConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConfigService {

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

    private ConfigResponseDTO toConfigResponseDTO(Configuration configuration) {
        return new ConfigResponseDTO(
                configuration.getConfigName(),
                configuration.getConfigValue(),
                configuration.getDescription(),
                configuration.getUpdatedAt());
    }
}