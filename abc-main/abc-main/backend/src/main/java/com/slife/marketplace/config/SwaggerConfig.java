/**
 * Mục đích: Cấu hình SwaggerConfig.java
 * Endpoints liên quan: N/A
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.config;
import org.springframework.context.annotation.*;import io.swagger.v3.oas.models.*;import io.swagger.v3.oas.models.info.Info;
@Configuration public class SwaggerConfig{ @Bean OpenAPI openAPI(){ return new OpenAPI().info(new Info().title("SLIFE API").version("v1")); } }