package com.slife.marketplace.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @Lob
    @Column(name = "type", nullable = false)
    private String type;

    @Size(max = 50)
    @Column(name = "ref_type", length = 50)
    private String refType;

    @Column(name = "ref_id")
    private Long refId;

    @NotNull
    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;


}