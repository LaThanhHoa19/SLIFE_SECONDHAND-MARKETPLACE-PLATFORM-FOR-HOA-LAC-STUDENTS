package com.slife.marketplace.repository;

import com.slife.marketplace.entity.ReportImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportImageRepository extends JpaRepository<ReportImage, Long> {
    Optional<ReportImage> findTopByReport_IdOrderByCreatedAtDesc(Long reportId);
}

