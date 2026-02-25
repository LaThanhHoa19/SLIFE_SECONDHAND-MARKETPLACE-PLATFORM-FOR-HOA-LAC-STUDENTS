/**
 * Mục đích: Entity Address
 * Endpoints liên quan: JPA
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.entity;
import jakarta.persistence.*;import lombok.Data;
@Data @Entity @Table(name="address") public class Address { @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id; private String placeholder; }