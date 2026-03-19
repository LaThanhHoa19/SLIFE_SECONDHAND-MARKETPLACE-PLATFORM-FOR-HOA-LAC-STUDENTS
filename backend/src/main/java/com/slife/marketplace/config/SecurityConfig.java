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
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}

