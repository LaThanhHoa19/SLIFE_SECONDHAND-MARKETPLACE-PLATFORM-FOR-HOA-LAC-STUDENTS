/**
 * Mục đích: Cấu hình SecurityConfig.java
 * Endpoints liên quan: N/A
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.config;
import org.springframework.context.annotation.*;import org.springframework.security.config.annotation.web.builders.HttpSecurity;import org.springframework.security.web.SecurityFilterChain;import org.springframework.security.config.http.SessionCreationPolicy;
@Configuration public class SecurityConfig{ @Bean SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception { http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a->a.requestMatchers("/api/auth/**","/swagger-ui/**","/v3/api-docs/**").permitAll().anyRequest().authenticated()); return http.build(); }}