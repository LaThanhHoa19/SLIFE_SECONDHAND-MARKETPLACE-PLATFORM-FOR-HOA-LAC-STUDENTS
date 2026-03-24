package com.slife.marketplace.repository;
import com.slife.marketplace.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository 
public interface DealRepository extends JpaRepository<Deal, Long> {
    Optional<Deal> findByIdAndDeletedAtIsNull(Long id);
    List<Deal> findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(String status, LocalDateTime updatedAt);
}