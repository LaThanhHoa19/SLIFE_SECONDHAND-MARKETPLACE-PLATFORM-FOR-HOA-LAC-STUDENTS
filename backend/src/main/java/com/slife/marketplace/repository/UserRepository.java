package com.slife.marketplace.repository;
import com.slife.marketplace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;import org.springframework.stereotype.Repository;
@Repository public interface UserRepository extends JpaRepository<User,Long> { } // TODO query methods.