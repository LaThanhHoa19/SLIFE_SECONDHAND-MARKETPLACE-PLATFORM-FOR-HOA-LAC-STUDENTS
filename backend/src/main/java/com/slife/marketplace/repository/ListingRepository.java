/**
 * Mục đích: Repository ListingRepository
 * Endpoints liên quan: service
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.repository;
import com.slife.marketplace.entity.Listing;import org.springframework.data.jpa.repository.JpaRepository;import org.springframework.stereotype.Repository;
@Repository public interface ListingRepository extends JpaRepository<Listing,Long> { // TODO query methods. }