package com.slife.marketplace.repository;

import com.slife.marketplace.entity.SavedListing;
import com.slife.marketplace.entity.SavedListingId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedListingRepository extends JpaRepository<SavedListing, SavedListingId> {

    Page<SavedListing> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    boolean existsByUser_IdAndListing_Id(Long userId, Long listingId);

    void deleteByUser_IdAndListing_Id(Long userId, Long listingId);

    @Query("SELECT s.listing.id FROM SavedListing s WHERE s.user.id = :userId")
    List<Long> findListingIdsByUserId(@Param("userId") Long userId);
}