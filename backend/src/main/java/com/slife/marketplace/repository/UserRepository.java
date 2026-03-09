/**
 * Mục đích: Repository UserRepository
 * Endpoints liên quan: service
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.repository;

import com.slife.marketplace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    /** Tìm user trùng fullName nhưng khác ID (để phát hiện duplicate seed user). */
    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) = LOWER(:name) AND u.id != :excludeId")
    List<User> findDuplicatesByFullName(@Param("name") String name, @Param("excludeId") Long excludeId);
}
