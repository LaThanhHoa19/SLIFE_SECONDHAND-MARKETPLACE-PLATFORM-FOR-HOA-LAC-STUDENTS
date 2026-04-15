package com.slife.marketplace.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/search",
                                "/api/categories",
                                "/api/locations",
                                "/api/geo/**",
                                "/api/public/**",
                                "/public/landing",
                                "/uploads/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/chat/**")
                        .permitAll()

                        // Chức năng listing cá nhân
                        .requestMatchers("/api/listings/my/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/listings/*/save").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/listings/*/save").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/listings/*/like").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/listings/*/draft").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/repost").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/renew").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/hide").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/unhide").authenticated()
                        .requestMatchers("/api/me/**").authenticated()

                        // Kiểm tra /me trước khi kiểm tra wildcard /*
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()

                        // Public truy cập (khách xem được)
                        .requestMatchers(HttpMethod.GET, "/api/users/*/followers", "/api/users/*/following", "/api/users/*/reviews").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/listings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/hashtags/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/community-posts/*/comments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/listings/*/comments").permitAll()

                        // Admin-only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Mọi request còn lại yêu cầu đăng nhập
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((request, response, authException) -> {
                            // 401 so REST clients (Axios) can refresh JWT; anonymous on protected routes was 403 by default.
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            var body = ApiResponse.error("UNAUTHORIZED", "Authentication required");
                            response.getWriter().write(objectMapper.writeValueAsString(body));
                        })
                        .accessDeniedHandler((request, response, ex) -> {
                            response.setStatus(403);
                        }))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
