package com.slife.marketplace.repository;

import com.slife.marketplace.entity.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OfferStatusRepository extends JpaRepository<OfferStatus, Long> {
    Optional<OfferStatus> findByCode(String code);
}
