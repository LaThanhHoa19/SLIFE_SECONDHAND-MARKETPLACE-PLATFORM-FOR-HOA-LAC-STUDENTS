package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Block;
import com.slife.marketplace.entity.BlockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlockRepository extends JpaRepository<Block, BlockId> {

    boolean existsByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);
}
