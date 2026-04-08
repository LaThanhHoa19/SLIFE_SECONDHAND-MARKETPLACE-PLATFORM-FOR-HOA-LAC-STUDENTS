package com.slife.marketplace.repository;

import com.slife.marketplace.entity.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface ListingImageRepository extends JpaRepository<ListingImage, Long> {

    /** Một ảnh đại diện (tránh lazy-load toàn bộ {@code listing.images} → lỗi Hibernate với nhiều collection). */
    Optional<ListingImage> findFirstByListing_IdOrderByDisplayOrderAsc(Long listingId);

    /**
     * Counts the current number of images for a listing.
     * Useful for enforcing upload limits.
     */
    int countByListing_Id(Long listingId);

    /**
     * Retrieves all images for a specific listing, sorted by their display sequence.
     */
    List<ListingImage> findByListing_IdOrderByDisplayOrderAsc(Long listingId);

    /**
     * Batch-fetches images for a set of listing IDs in a single query.
     * Used to avoid N+1 when enriching feed cards.
     */
    @Query("SELECT img FROM ListingImage img WHERE img.listing.id IN :listingIds ORDER BY img.listing.id ASC, img.displayOrder ASC")
    List<ListingImage> findByListingIdIn(@Param("listingIds") Set<Long> listingIds);

    /**
     * Deletes all images belonging to a listing.
     * Must be called before deleting the listing to satisfy FK constraint.
     */
    void deleteByListing_Id(Long listingId);
}