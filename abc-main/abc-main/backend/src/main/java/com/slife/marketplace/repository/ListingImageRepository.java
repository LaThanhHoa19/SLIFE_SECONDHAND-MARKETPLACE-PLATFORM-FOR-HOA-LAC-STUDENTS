package com.slife.marketplace.repository;

import com.slife.marketplace.entity.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingImageRepository extends JpaRepository<ListingImage, Long> {

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
     * Deletes all images belonging to a listing.
     * Must be called before deleting the listing to satisfy FK constraint.
     */
    void deleteByListing_Id(Long listingId);
}