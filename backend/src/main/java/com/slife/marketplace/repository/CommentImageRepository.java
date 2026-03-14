package com.slife.marketplace.repository;

import com.slife.marketplace.entity.CommentImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentImageRepository extends JpaRepository<CommentImage, Long> {
    List<CommentImage> findByComment_Id(Long commentId);
}