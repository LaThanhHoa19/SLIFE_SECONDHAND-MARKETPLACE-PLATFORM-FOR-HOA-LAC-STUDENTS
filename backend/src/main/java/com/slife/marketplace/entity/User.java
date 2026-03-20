package com.slife.marketplace.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id", nullable = false)
    private Long id;

    @Size(max = 255)
    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @JsonIgnore
    @Size(max = 255)
    @Column(name = "password_hash")
    private String passwordHash;

    @Size(max = 200)
    @NotNull
    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Size(max = 50)
    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "phone_number_verified", nullable = false)
    private boolean phoneNumberVerified;

    @Size(max = 1000)
    @Column(name = "avatar_url", length = 1000)
    private String avatarUrl;

    @Size(max = 1000)
    @Column(name = "cover_image_url", length = 1000)
    private String coverImageUrl;

    @Lob
    @Column(name = "bio")
    private String bio;

    @NotNull
    @ColumnDefault("'USER'")
    @Column(name = "role", nullable = false)
    private String role;

    @NotNull
    @ColumnDefault("'ACTIVE'")
    @Column(name = "status", nullable = false)
    private String status;

    @NotNull
    @ColumnDefault("5.00")
    @Column(name = "reputation_score", nullable = false, precision = 3, scale = 2)
    private BigDecimal reputationScore;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "violation_count", nullable = false)
    private Integer violationCount;

    @NotNull
    @Column(name = "created_at", nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime createdAt;

    @NotNull
    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at", columnDefinition = "DATETIME")
    private LocalDateTime deletedAt;

}