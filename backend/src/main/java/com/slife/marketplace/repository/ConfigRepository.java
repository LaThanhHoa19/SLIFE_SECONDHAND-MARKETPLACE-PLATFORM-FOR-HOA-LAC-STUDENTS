package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfigRepository extends JpaRepository<Configuration, Long> {

    List<Configuration> findAllByDeletedAtIsNullOrderByUpdatedAtDesc();

    List<Configuration> findByConfigNameInAndDeletedAtIsNull(List<String> configNames);

    /** Đọc giá trị runtime / cache — chỉ bản chưa xóa mềm */
    Optional<Configuration> findByConfigNameAndDeletedAtIsNull(String configName);

    /** Theo tên (unique DB): có thể là bản đã soft-delete — dùng khi PUT bulk để restore */
    Optional<Configuration> findByConfigName(String configName);

    Optional<Configuration> findByIdAndDeletedAtIsNull(Long id);
}