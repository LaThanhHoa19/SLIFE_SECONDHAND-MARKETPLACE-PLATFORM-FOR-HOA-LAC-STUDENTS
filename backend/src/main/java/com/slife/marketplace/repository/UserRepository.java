package com.slife.marketplace.repository;

import com.slife.marketplace.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    /** Người khác đã có phone_number (để kiểm tra trùng SĐT khi xác minh Firebase). */
    List<User> findByIdNotAndPhoneNumberIsNotNull(Long excludeUserId);
    Page<User> findByRole(String role, Pageable pageable);

    Page<User> findByRoleAndStatus(String role, String status, Pageable pageable);

    Optional<User> findByIdAndRole(Long id, String role);

    long countByRole(String role);

    long countByStatus(String status);

    long countByRoleAndStatus(String role, String status);

    @Query("SELECT AVG(u.reputationScore) FROM User u WHERE u.status = 'ACTIVE'")
    BigDecimal averageReputationScoreForActiveUsers();

    /** Số người dùng mới đăng ký mỗi ngày trong N ngày gần nhất (role=USER). */
    @Query(value = """
            SELECT DATE(u.created_at) AS day, COUNT(*) AS cnt
            FROM users u
            WHERE u.role = 'USER'
              AND u.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
            GROUP BY DATE(u.created_at)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> countUsersByDayLast(@org.springframework.data.repository.query.Param("days") int days);
}
