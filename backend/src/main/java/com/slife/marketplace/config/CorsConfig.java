package com.slife.marketplace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    /** Cho phép thêm origin (Docker: user truy cập qua nginx http://localhost). */
    @Value("${app.cors.allowed-origins:}")
    private String allowedOriginsExtra;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        /*
         * Dùng allowedOriginPatterns (Spring 5.3+) để khớp mọi hostname S3 static website trong region
         * và tránh lệch 1 ký tự so với Origin trình duyệt gửi.
         * Bổ sung origin cụ thể + env app.cors.allowed-origins (CloudFront, domain riêng, …).
         */
        List<String> patterns = new java.util.ArrayList<>(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://*.s3-website-ap-southeast-1.amazonaws.com",
                "https://*.s3-website-ap-southeast-1.amazonaws.com",
                "http://slife-frontend.s3-website-ap-southeast-1.amazonaws.com",
                "https://slife-frontend.s3-website-ap-southeast-1.amazonaws.com"
        ));
        if (allowedOriginsExtra != null && !allowedOriginsExtra.isBlank()) {
            for (String o : allowedOriginsExtra.split(",")) {
                String t = o.trim();
                if (!t.isEmpty()) {
                    if (t.contains("*")) {
                        patterns.add(t);
                    } else {
                        // Chuỗi origin đầy đủ — dùng làm pattern khớp chính nó
                        patterns.add(t);
                    }
                }
            }
        }
        config.setAllowedOriginPatterns(patterns);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
