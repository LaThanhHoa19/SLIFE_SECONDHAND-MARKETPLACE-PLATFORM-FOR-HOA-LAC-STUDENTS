package com.slife.marketplace.repository;

import com.slife.marketplace.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByOccurredAtDesc(Pageable pageable);

    Page<AuditLog> findAllByActionOrderByOccurredAtDesc(String action, Pageable pageable);
}
