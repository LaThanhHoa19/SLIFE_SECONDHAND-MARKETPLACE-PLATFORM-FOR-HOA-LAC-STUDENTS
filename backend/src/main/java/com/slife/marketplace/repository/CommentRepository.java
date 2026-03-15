package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByListing_IdOrderByCreatedAtAsc(Long listingId);
}

