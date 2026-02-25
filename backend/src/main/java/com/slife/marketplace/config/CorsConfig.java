/**
 * Mục đích: Cấu hình CorsConfig.java
 * Endpoints liên quan: N/A
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.config;
import org.springframework.context.annotation.*;import org.springframework.web.filter.CorsFilter;import org.springframework.web.cors.*;import java.util.List;
@Configuration public class CorsConfig{ @Bean CorsFilter corsFilter(){ CorsConfiguration c=new CorsConfiguration(); c.setAllowedOriginPatterns(List.of("*")); c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS")); c.setAllowedHeaders(List.of("*")); UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource(); s.registerCorsConfiguration("/**",c); return new CorsFilter(s);} }