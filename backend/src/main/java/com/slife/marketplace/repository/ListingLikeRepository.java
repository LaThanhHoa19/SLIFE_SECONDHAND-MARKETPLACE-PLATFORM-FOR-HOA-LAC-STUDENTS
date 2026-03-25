package com.slife.marketplace.repository;

import com.slife.marketplace.entity.ListingLike;
import com.slife.marketplace.entity.ListingLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ListingLikeRepository extends JpaRepository<ListingLike, ListingLikeId> {

    boolean existsByUser_IdAndListing_Id(Long userId, Long listingId);

    void deleteByUser_IdAndListing_Id(Long userId, Long listingId);

    long countByListing_Id(Long listingId);

    @Query("SELECT ll.listing.id, COUNT(ll) FROM ListingLike ll WHERE ll.listing.id IN :ids GROUP BY ll.listing.id")
    List<Object[]> countGroupedByListingId(@Param("ids") Collection<Long> ids);

    @Query("SELECT ll.listing.id FROM ListingLike ll WHERE ll.user.id = :userId AND ll.listing.id IN :ids")
    List<Long> findLikedListingIds(@Param("userId") Long userId, @Param("ids") Collection<Long> ids);
}
