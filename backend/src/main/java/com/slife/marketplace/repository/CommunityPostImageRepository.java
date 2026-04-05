package com.slife.marketplace.repository;

import com.slife.marketplace.entity.CommunityPostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CommunityPostImageRepository extends JpaRepository<CommunityPostImage, Long> {

    int countByPost_Id(Long postId);

    List<CommunityPostImage> findByPost_IdInOrderByPost_IdAscDisplayOrderAsc(Collection<Long> postIds);

    List<CommunityPostImage> findByPost_IdOrderByDisplayOrderAsc(Long postId);
}
