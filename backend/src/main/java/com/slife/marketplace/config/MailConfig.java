/**
 * Mục đích: Cấu hình MailConfig.java
 * Endpoints liên quan: N/A
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.config;
import org.springframework.context.annotation.*;import org.springframework.mail.javamail.*;
@Configuration public class MailConfig{ @Bean JavaMailSender javaMailSender(){ return new JavaMailSenderImpl(); } }