package com.slife.marketplace.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class VietmapService {

    private final String servicesKey;
    private final String baseUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public VietmapService(
            @Value("${vietmap.servicesKey:}") String servicesKey,
            @Value("${vietmap.baseUrl:https://maps.vietmap.vn/api}") String baseUrl,
            ObjectMapper objectMapper) {
        this.servicesKey = servicesKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> search(String query, Double lat, Double lng) {
        if (servicesKey == null || servicesKey.isBlank()) {
            log.warn("Vietmap servicesKey is not configured; search disabled.");
            return Collections.emptyList();
        }
        try {
            StringBuilder url = new StringBuilder(baseUrl)
                    .append("/search/v3")
                    .append("?apikey=").append(enc(servicesKey))
                    .append("&text=").append(enc(query));

            // Bias khu vực Hòa Lạc (nếu FE chưa truyền lat/lng)
            double centerLat = lat != null ? lat : 21.0135;
            double centerLng = lng != null ? lng : 105.5257;
            url.append("&location=").append(centerLng).append(",").append(centerLat);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url.toString()))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Vietmap search failed: status={}, body={}", response.statusCode(), response.body());
                return Collections.emptyList();
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<>() {});
            Object results = body.get("results");
            if (!(results instanceof List<?> list)) {
                return Collections.emptyList();
            }

            // Chuẩn hóa output: id, name, address, lat, lng
            return list.stream()
                    .filter(Map.class::isInstance)
                    .map(raw -> {
                        Map<?, ?> m = (Map<?, ?>) raw;
                        return Map.<String, Object>of(
                                "id", m.getOrDefault("place_id", null),
                                "name", m.getOrDefault("name", null),
                                "address", m.getOrDefault("address", null),
                                "lat", m.getOrDefault("lat", null),
                                "lng", m.getOrDefault("lng", null)
                        );
                    })
                    .toList();
        } catch (Exception e) {
            log.error("Vietmap search error: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public Map<String, Object> reverse(double lat, double lng) {
        if (servicesKey == null || servicesKey.isBlank()) {
            log.warn("Vietmap servicesKey is not configured; reverse disabled.");
            return Map.of();
        }
        try {
            String url = baseUrl
                    + "/reverse/v3?"
                    + "apikey=" + enc(servicesKey)
                    + "&point=" + lng + "," + lat;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Vietmap reverse failed: status={}, body={}", response.statusCode(), response.body());
                return Map.of();
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<>() {});
            Object result = body.get("result");
            if (!(result instanceof Map<?, ?> m)) {
                return Map.of();
            }
            Object name = m.getOrDefault("name", null);
            Object address = m.getOrDefault("address", null);

            return Map.of(
                    "locationName", name != null ? name : address,
                    "addressText", address,
                    "lat", lat,
                    "lng", lng
            );
        } catch (Exception e) {
            log.error("Vietmap reverse error: {}", e.getMessage(), e);
            return Map.of();
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
    }
}

