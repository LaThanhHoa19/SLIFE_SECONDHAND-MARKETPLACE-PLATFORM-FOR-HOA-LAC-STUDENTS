package com.slife.marketplace.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.response.BaseResponse;
import com.slife.marketplace.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;

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
            .requestMatchers("/actuator/health").permitAll()
            .requestMatchers(
                "/api/auth/**",
                "/api/search",
                "/api/categories",
                "/api/locations",
                "/api/geo/**",
                "/uploads/**",
                "/swagger-ui/**",
                "/v3/api-docs/**")
            .permitAll()
            // Save listing: auth required
            .requestMatchers(HttpMethod.POST, "/api/listings/*/save").authenticated()
            .requestMatchers(HttpMethod.DELETE, "/api/listings/*/save").authenticated()
            // Delete draft listing: chỉ seller mới được thực hiện
            .requestMatchers(HttpMethod.DELETE, "/api/listings/*/draft").authenticated()
            // Repost / Renew listing: chỉ seller mới được thực hiện
            .requestMatchers(HttpMethod.PATCH, "/api/listings/*/repost").authenticated()
            .requestMatchers(HttpMethod.PATCH, "/api/listings/*/renew").authenticated()
            // Hide / Unhide listing: chỉ seller mới được thực hiện
            .requestMatchers(HttpMethod.PATCH, "/api/listings/*/hide").authenticated()
            .requestMatchers(HttpMethod.PATCH, "/api/listings/*/unhide").authenticated()
            .requestMatchers("/api/me/**").authenticated()
            // Guest access
            .requestMatchers("/api/listings/**").permitAll()
            // Admin-only
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            // Everything else requires authentication
            .anyRequest()
            .authenticated())
        .exceptionHandling(e -> e.accessDeniedHandler((request, response, ex) -> {
          response.setStatus(HttpServletResponse.SC_FORBIDDEN);
          response.setCharacterEncoding("UTF-8");
          response.setContentType(MediaType.APPLICATION_JSON_VALUE);
          BaseResponse<Object> body = new BaseResponse<>("FORBIDDEN", "Bạn không có quyền truy cập tính năng này", null);
          response.getWriter().write(objectMapper.writeValueAsString(body));
        }))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}

