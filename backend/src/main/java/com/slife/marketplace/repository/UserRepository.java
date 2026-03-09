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

    /**
     * Essential for SecurityConfig and JwtAuthenticationFilter to load 
     * user details during login.
     */
    Optional<User> findByEmail(String email);

    /** * UC-Auth: Finds users with the same full name but different IDs.
     * Useful for cleanup tasks or preventing duplicate profile creation.
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) = LOWER(:name) AND u.id != :excludeId")
    List<User> findDuplicatesByFullName(@Param("name") String name, @Param("excludeId") Long excludeId);
}