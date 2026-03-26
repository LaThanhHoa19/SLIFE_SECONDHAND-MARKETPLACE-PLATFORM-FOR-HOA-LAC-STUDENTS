package com.slife.marketplace.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "conversations")
public class Conversation {

    /** ChatSession status per spec: ACTIVE, CLOSED, SPAM */
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_CLOSED = "CLOSED";
    public static final String STATUS_SPAM = "SPAM";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id", nullable = false)
    private Long id;

    @Column(name = "session_uuid", nullable = false, unique = true, length = 36)
    private String sessionUuid;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id1", nullable = false)
    private User userId1;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id2", nullable = false)
    private User userId2;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "listing_id")
    private Listing listing;

    @Column(name = "status", nullable = false, length = 20)
    @ColumnDefault("'ACTIVE'")
    private String status = STATUS_ACTIVE;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void ensureSessionUuid() {
        if (sessionUuid == null || sessionUuid.isBlank()) {
            sessionUuid = UUID.randomUUID().toString();
        }
    }

    /**
     * SCRUM-83 semantic alias:
     * in current schema user_id1 is treated as buyer.
     */
    @Transient
    public User getBuyer() {
        return userId1;
    }

    /**
     * SCRUM-83 semantic alias:
     * in current schema user_id1 is treated as buyer.
     */
    @Transient
    public void setBuyer(User buyer) {
        this.userId1 = buyer;
    }

    /**
     * SCRUM-83 semantic alias:
     * in current schema user_id2 is treated as seller.
     */
    @Transient
    public User getSeller() {
        return userId2;
    }

    /**
     * SCRUM-83 semantic alias:
     * in current schema user_id2 is treated as seller.
     */
    @Transient
    public void setSeller(User seller) {
        this.userId2 = seller;
    }
}