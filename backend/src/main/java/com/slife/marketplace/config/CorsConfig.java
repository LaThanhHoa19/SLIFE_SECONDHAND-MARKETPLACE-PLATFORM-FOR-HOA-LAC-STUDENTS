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
        // Local dev (Vite 5173) + Docker (nginx port 80)
        List<String> origins = new java.util.ArrayList<>(List.of(
                "http://localhost:5173",
                "http://localhost",
                "http://localhost:80",
                "http://127.0.0.1",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:80"
        ));
        if (allowedOriginsExtra != null && !allowedOriginsExtra.isBlank()) {
            for (String o : allowedOriginsExtra.split(",")) {
                String t = o.trim();
                if (!t.isEmpty()) origins.add(t);
            }
        }
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
