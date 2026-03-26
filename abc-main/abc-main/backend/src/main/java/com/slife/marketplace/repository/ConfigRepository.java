package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfigRepository extends JpaRepository<Configuration, Long> {
    List<Configuration> findAllByOrderByUpdatedAtDesc();
    List<Configuration> findByConfigNameIn(List<String> configNames);
    Optional<Configuration> findByConfigName(String configName);
}