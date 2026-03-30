package com.slife.marketplace.repository;

import com.slife.marketplace.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Page<User> findByRole(String role, Pageable pageable);

    Page<User> findByRoleAndStatus(String role, String status, Pageable pageable);

    Optional<User> findByIdAndRole(Long id, String role);

    long countByRole(String role);

    long countByStatus(String status);

    @Query("SELECT AVG(u.reputationScore) FROM User u WHERE u.status = 'ACTIVE'")
    BigDecimal averageReputationScoreForActiveUsers();
}
