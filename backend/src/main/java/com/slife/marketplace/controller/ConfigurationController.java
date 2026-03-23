package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.BaseResponse;
import com.slife.marketplace.dto.response.ConfigResponseDTO;
import com.slife.marketplace.service.ConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@PreAuthorize("hasRole('ADMIN')")
public class ConfigurationController {

    private final ConfigService configService;

    public ConfigurationController(ConfigService configService) {
        this.configService = configService;
    }

    @GetMapping("/api/admin/configurations")
    public ResponseEntity<BaseResponse<List<ConfigResponseDTO>>> getAllConfigurations() {
        List<ConfigResponseDTO> configurations = configService.getAllConfigurations();
        return ResponseEntity.ok(BaseResponse.success("OK", configurations));
    }
}
