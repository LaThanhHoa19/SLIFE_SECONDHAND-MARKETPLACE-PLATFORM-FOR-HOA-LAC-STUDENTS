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
import java.util.Optional;

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
        try {
            if (servicesKey == null || servicesKey.isBlank()) {
                // Fallback to OSM (Nominatim) when Vietmap servicesKey is missing
                return osmReverse(lat, lng);
            }

            Map<String, Object> vietmap = vietmapReverse(lat, lng);
            if (vietmap != null && !vietmap.isEmpty()) {
                return vietmap;
            }

            // If Vietmap fails (quota/network), fallback to OSM to avoid breaking FE validation
            return osmReverse(lat, lng);
        } catch (Exception e) {
            log.error("Vietmap reverse error: {}", e.getMessage(), e);
            try {
                return osmReverse(lat, lng);
            } catch (Exception ignored) {
                return Map.of();
            }
        }
    }

    private Map<String, Object> vietmapReverse(double lat, double lng) throws Exception {
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
            log.warn("Vietmap reverse failed: status={}, body={}", response.statusCode(), abbreviate(response.body(), 240));
            return Map.of();
        }

        Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<>() {});
        Object result = body.get("result");
        if (!(result instanceof Map<?, ?> m)) {
            return Map.of();
        }
        Object name = m.getOrDefault("name", null);
        Object address = m.getOrDefault("address", null);

        String province = firstNonBlank(
                asString(m.get("province")),
                asString(m.get("city")),
                asString(m.get("state"))
        );
        String district = firstNonBlank(
                asString(m.get("district")),
                asString(m.get("county")),
                asString(m.get("city_district"))
        );
        String ward = firstNonBlank(
                asString(m.get("ward")),
                asString(m.get("suburb")),
                asString(m.get("village")),
                asString(m.get("quarter"))
        );

        Map<String, Object> out = new HashMap<>();
        out.put("locationName", name != null ? name : address);
        out.put("addressText", address);
        out.put("province", province);
        out.put("district", district);
        out.put("ward", ward);
        out.put("lat", lat);
        out.put("lng", lng);
        return out;
    }

    private Map<String, Object> osmReverse(double lat, double lng) throws Exception {
        String url = "https://nominatim.openstreetmap.org/reverse"
                + "?format=json"
                + "&lat=" + lat
                + "&lon=" + lng
                + "&zoom=18"
                + "&addressdetails=1";

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .header("Accept-Language", "vi")
                // Nominatim requires a valid User-Agent identifying the application
                .header("User-Agent", "SLIFE-Marketplace/1.0 (reverse-geocode; local-dev)")
                .GET()
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            log.warn("OSM reverse failed: status={}, body={}", resp.statusCode(), abbreviate(resp.body(), 240));
            return Map.of();
        }

        Map<String, Object> body = objectMapper.readValue(resp.body(), new TypeReference<>() {});
        Object addressObj = body.get("address");
        if (!(addressObj instanceof Map<?, ?> ad)) {
            return Map.of();
        }

        String province = firstNonBlank(
                asString(ad.get("city")),
                asString(ad.get("province")),
                asString(ad.get("state"))
        );
        String district = firstNonBlank(
                asString(ad.get("county")),
                asString(ad.get("district")),
                asString(ad.get("city_district")),
                asString(ad.get("town"))
        );
        String ward = firstNonBlank(
                asString(ad.get("suburb")),
                asString(ad.get("village")),
                asString(ad.get("quarter"))
        );

        String name = firstNonBlank(
                asString(body.get("name")),
                asString(ad.get("road"))
        );

        String addressText = asString(body.get("display_name"));
        if (addressText.isBlank()) {
            StringBuilder sb = new StringBuilder();
            for (String p : new String[]{name, ward, district, province}) {
                if (p != null && !p.isBlank()) {
                    if (!sb.isEmpty()) sb.append(", ");
                    sb.append(p.trim());
                }
            }
            addressText = sb.toString();
        }

        Map<String, Object> out = new HashMap<>();
        out.put("locationName", !name.isBlank() ? name : addressText);
        out.put("addressText", addressText);
        out.put("province", province);
        out.put("district", district);
        out.put("ward", ward);
        out.put("lat", lat);
        out.put("lng", lng);
        return out;
    }

    /**
     * Lấy bounding box của khu vực hành chính từ OSM search (Nominatim).
     * Dùng để validate pin nằm trong khu vực đã chọn ngay cả khi reverse name bị sai.
     *
     * @return { minLat, maxLat, minLng, maxLng, label } hoặc empty
     */
    public Optional<Map<String, Object>> osmAdminBbox(String province, String district, String ward) {
        try {
            String q = String.join(", ",
                    List.of(ward, district, province, "Việt Nam").stream()
                            .filter(s -> s != null && !s.isBlank())
                            .toList()
            );
            if (q.isBlank()) return Optional.empty();

            String url = "https://nominatim.openstreetmap.org/search"
                    + "?format=json"
                    + "&limit=1"
                    + "&q=" + enc(q);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .header("Accept-Language", "vi")
                    .header("User-Agent", "SLIFE-Marketplace/1.0 (admin-bbox; local-dev)")
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                log.warn("OSM search failed: status={}, body={}", resp.statusCode(), abbreviate(resp.body(), 240));
                return Optional.empty();
            }

            List<Map<String, Object>> arr = objectMapper.readValue(resp.body(), new TypeReference<>() {});
            Map<String, Object> first = (arr != null && !arr.isEmpty()) ? arr.get(0) : null;
            if (first == null) return Optional.empty();
            Object bbObj = first.get("boundingbox");
            if (!(bbObj instanceof List<?> bb) || bb.size() < 4) return Optional.empty();

            double south = Double.parseDouble(String.valueOf(bb.get(0)));
            double north = Double.parseDouble(String.valueOf(bb.get(1)));
            double west = Double.parseDouble(String.valueOf(bb.get(2)));
            double east = Double.parseDouble(String.valueOf(bb.get(3)));

            Map<String, Object> out = new HashMap<>();
            out.put("minLat", Math.min(south, north));
            out.put("maxLat", Math.max(south, north));
            out.put("minLng", Math.min(west, east));
            out.put("maxLng", Math.max(west, east));
            out.put("label", q);
            return Optional.of(out);
        } catch (Exception e) {
            log.warn("OSM admin bbox error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private static String asString(Object v) {
        return v != null ? String.valueOf(v).trim() : "";
    }

    private static String firstNonBlank(String... candidates) {
        if (candidates == null) return "";
        for (String c : candidates) {
            if (c != null && !c.isBlank()) return c.trim();
        }
        return "";
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

