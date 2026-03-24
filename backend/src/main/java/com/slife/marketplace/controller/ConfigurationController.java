package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.ConfigUpdateRequest;
import com.slife.marketplace.dto.response.BaseResponse;
import com.slife.marketplace.dto.response.ConfigResponseDTO;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.ConfigService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.Constants;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@PreAuthorize("hasRole('ADMIN')")
public class ConfigurationController {

    private final ConfigService configService;
    private final UserService userService;

    public ConfigurationController(ConfigService configService, UserService userService) {
        this.configService = configService;
        this.userService = userService;
    }

    @GetMapping("/api/admin/configurations")
    public ResponseEntity<BaseResponse<List<ConfigResponseDTO>>> getAllConfigurations() {
        List<ConfigResponseDTO> configurations = configService.getAllConfigurations();
        return ResponseEntity.ok(BaseResponse.success("OK", configurations));
    }

    @PutMapping("/api/admin/configurations")
    public ResponseEntity<BaseResponse<String>> updateConfigurations(
            @RequestBody List<@Valid ConfigUpdateRequest> requests) {
        User admin = userService.getCurrentUser();
        String message = configService.updateConfigurations(requests, admin);
        return ResponseEntity.ok(BaseResponse.success(Constants.MSG19, message));
    }
}
