package com.slife.marketplace.repository;
import com.slife.marketplace.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository 
public interface DealRepository extends JpaRepository<Deal, Long> {

    Optional<Deal> findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
            Long listingId, Long proposedById, String status);
    long countByStatusAndDeletedAtIsNull(String status);

    Optional<Deal> findByIdAndDeletedAtIsNull(Long id);
    List<Deal> findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(String status, LocalDateTime updatedAt);

    List<Deal> findByProposedBy_IdAndDeletedAtIsNullOrderByCreatedAtDesc(Long proposedById);

    List<Deal> findByListing_Seller_IdAndDeletedAtIsNullOrderByCreatedAtDesc(Long sellerId);

    // Tìm deal cần tự động hoàn tất (theo status và thời gian tạo)
    List<Deal> findAllByStatusAndCreatedAtBefore(String status, LocalDateTime createdAt);

    // Tìm deal cần tự động hoàn tất (theo status và thời gian xác nhận)
    List<Deal> findAllByStatusAndConfirmedAtBefore(String status, LocalDateTime confirmedAt);
}