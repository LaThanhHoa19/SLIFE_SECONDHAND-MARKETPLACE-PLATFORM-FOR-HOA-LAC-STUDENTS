package com.slife.marketplace.repository;

import com.slife.marketplace.entity.CommunityPostCommentImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostCommentImageRepository extends JpaRepository<CommunityPostCommentImage, Long> {

    List<CommunityPostCommentImage> findByComment_Id(Long commentId);

    void deleteAllByComment_Id(Long commentId);
}
