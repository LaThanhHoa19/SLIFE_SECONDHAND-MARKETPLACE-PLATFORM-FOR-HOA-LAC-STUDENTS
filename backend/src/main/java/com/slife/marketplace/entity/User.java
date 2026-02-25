/**
 * Mục đích: Entity User
 * Endpoints liên quan: JPA
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.entity;
import jakarta.persistence.*;import lombok.Data;
@Data @Entity @Table(name="user") public class User { @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id; private String email; private Double reputation; public void recalcReputation(){ /* TODO avg review, default 5.0 */ } }