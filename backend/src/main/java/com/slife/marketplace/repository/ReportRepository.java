/**
 * Mục đích: Repository ReportRepository
 * Endpoints liên quan: service
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporter_IdAndTargetTypeAndTargetId(Long reporterId, String targetType, Long targetId);

    List<Report> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);

    @Query("SELECT r FROM Report r " +
            "WHERE (:targetType IS NULL OR r.targetType = :targetType) " +
            "AND (:status IS NULL OR r.status = :status) " +
            "ORDER BY r.createdAt DESC")
    Page<Report> findByFilters(@Param("targetType") String targetType,
                               @Param("status") String status,
                               Pageable pageable);

    long countByTargetTypeAndTargetIdAndStatus(String targetType, Long targetId, String status);
}