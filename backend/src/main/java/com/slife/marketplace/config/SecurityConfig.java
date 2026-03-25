package com.slife.marketplace.config;

import com.slife.marketplace.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/search",
                                "/api/categories",
                                "/api/locations",
                                "/api/geo/**",
                                "/uploads/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/chat/**") // Cho phép Websocket nếu có tính năng chat
                        .permitAll()

                        // Các chức năng yêu cầu đăng nhập
                        // Save listing: auth required

                        // Chức năng listing cá nhân
                        .requestMatchers("/api/listings/my/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/listings/*/save").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/listings/*/save").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/listings/*/like").authenticated()
                        // Delete draft listing: chỉ seller mới được thực hiện
                        .requestMatchers(HttpMethod.DELETE, "/api/listings/*/draft").authenticated()
                        // Repost / Renew listing: chỉ seller mới được thực hiện
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/repost").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/renew").authenticated()
                        // Hide / Unhide listing: chỉ seller mới được thực hiện
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/hide").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/*/unhide").authenticated()
                        .requestMatchers("/api/me/**").authenticated()

                        // Kiểm tra /me trước khi kiểm tra wildcard /*
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()

                        // Public truy cập (khách xem được)
                        // /api/users/me must be checked before the wildcard below
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/followers", "/api/users/*/following").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/listings/**").permitAll()
                        // Guest access
                        .requestMatchers("/api/listings/**").permitAll()
                        // Xem bình luận tin đăng không cần đăng nhập (POST/DELETE vẫn yêu cầu auth)
                        .requestMatchers(HttpMethod.GET, "/api/v1/listings/*/comments").permitAll()

                        // Admin-only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Mọi request còn lại yêu cầu đăng nhập
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

