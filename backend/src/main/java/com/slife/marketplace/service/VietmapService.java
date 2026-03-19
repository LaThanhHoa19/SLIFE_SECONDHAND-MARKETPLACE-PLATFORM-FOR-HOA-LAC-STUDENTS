package com.slife.marketplace.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
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

            // Ưu tiên khu vực (theo tài liệu Vietmap: focus=lat,lng)
            double centerLat = lat != null ? lat : 21.0135;
            double centerLng = lng != null ? lng : 105.5257;
            url.append("&focus=").append(centerLat).append(",").append(centerLng);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url.toString()))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Vietmap search failed: status={}, body={}", response.statusCode(), response.body());
                return Collections.emptyList();
            }

            // Vietmap search/v3 có thể trả JSON dạng { "results": [...] } hoặc mảng [...] ở root
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode resultsNode = resolveSearchResultsArray(root);
            if (resultsNode == null || !resultsNode.isArray()) {
                log.warn("Vietmap search: unexpected JSON root (expected array or object.results), snippet={}",
                        abbreviate(response.body(), 240));
                return Collections.emptyList();
            }

            List<Map<String, Object>> out = new ArrayList<>();
            for (JsonNode item : resultsNode) {
                if (!item.isObject()) {
                    continue;
                }
                Map<String, Object> m = objectMapper.convertValue(item, new TypeReference<>() {});
                out.add(normalizeSearchHit(m));
            }
            return out;
        } catch (Exception e) {
            log.error("Vietmap search error: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Chi tiết địa điểm theo ref_id từ kết quả search/v3 (có lat/lng).
     * @see <a href="https://maps.vietmap.vn/docs/map-api/place/">Place v3</a>
     */
    public Map<String, Object> placeByRefId(String refId) {
        if (servicesKey == null || servicesKey.isBlank()) {
            log.warn("Vietmap servicesKey is not configured; place disabled.");
            return Collections.emptyMap();
        }
        if (refId == null || refId.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            String url = baseUrl
                    + "/place/v3?apikey=" + enc(servicesKey)
                    + "&refid=" + enc(refId.trim());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Vietmap place failed: status={}, body={}", response.statusCode(), abbreviate(response.body(), 200));
                return Collections.emptyMap();
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<>() {});
            Map<String, Object> out = new HashMap<>();
            out.put("lat", body.get("lat"));
            out.put("lng", body.get("lng"));
            out.put("display", body.get("display"));
            out.put("name", body.get("name"));
            out.put("address", body.get("address"));
            return out;
        } catch (Exception e) {
            log.error("Vietmap place error: {}", e.getMessage(), e);
            return Collections.emptyMap();
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

    private static JsonNode resolveSearchResultsArray(JsonNode root) {
        if (root == null || root.isNull()) {
            return null;
        }
        if (root.isArray()) {
            return root;
        }
        if (root.isObject()) {
            if (root.has("results") && root.get("results").isArray()) {
                return root.get("results");
            }
            if (root.has("data") && root.get("data").isArray()) {
                return root.get("data");
            }
        }
        return null;
    }

    /** Map.of không cho null — dùng HashMap cho từng dòng gợi ý. */
    private static Map<String, Object> normalizeSearchHit(Map<String, Object> m) {
        Map<String, Object> row = new HashMap<>();
        Object id = m.get("place_id");
        if (id == null) {
            id = m.get("id");
        }
        row.put("id", id);
        row.put("ref_id", m.get("ref_id"));
        row.put("display", m.get("display"));
        row.put("name", m.get("name"));
        row.put("address", m.get("address"));
        row.put("lat", m.get("lat"));
        row.put("lng", m.get("lng"));
        return row;
    }

    private static String abbreviate(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.replaceAll("\\s+", " ").trim();
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }

    private static String enc(String value) {
        return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
    }
}

