package com.slife.marketplace.repository;

import com.slife.marketplace.entity.BannedKeyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannedKeywordRepository extends JpaRepository<BannedKeyword, Long> {

    List<BannedKeyword> findAllByDeletedAtIsNullOrderByKeywordAsc();
}
