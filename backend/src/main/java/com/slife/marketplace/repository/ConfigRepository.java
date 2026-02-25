/**
 * Mục đích: Repository ConfigRepository
 * Endpoints liên quan: service
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.repository;
import com.slife.marketplace.entity.ConfigurationEntity;import org.springframework.data.jpa.repository.JpaRepository;import org.springframework.stereotype.Repository;
@Repository public interface ConfigRepository extends JpaRepository<ConfigurationEntity,Long> { // TODO query methods. }