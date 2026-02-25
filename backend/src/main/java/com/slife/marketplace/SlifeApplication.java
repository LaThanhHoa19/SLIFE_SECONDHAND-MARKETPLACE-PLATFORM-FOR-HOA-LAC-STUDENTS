/**
 * Mục đích: Entry point Spring Boot
 * Endpoints liên quan: N/A
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace;
import org.springframework.boot.SpringApplication;import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication public class SlifeApplication{public static void main(String[] args){SpringApplication.run(SlifeApplication.class,args);}}