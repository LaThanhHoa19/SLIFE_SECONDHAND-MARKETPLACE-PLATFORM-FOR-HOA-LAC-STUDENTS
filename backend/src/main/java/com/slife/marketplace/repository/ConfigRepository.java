package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConfigRepository extends JpaRepository<Configuration, Long> {
    List<Configuration> findAllByOrderByUpdatedAtDesc();
}