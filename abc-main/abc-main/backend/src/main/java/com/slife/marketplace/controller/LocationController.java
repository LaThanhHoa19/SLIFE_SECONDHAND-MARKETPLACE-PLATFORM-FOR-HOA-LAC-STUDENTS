package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/api/locations")
    public ResponseEntity<ApiResponse<List<String>>> getLocations() {
        List<String> locations = locationService.getPickupLocations();
        return ResponseEntity.ok(ApiResponse.success("OK", locations));
    }
}
