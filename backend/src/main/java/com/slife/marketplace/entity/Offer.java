package com.slife.marketplace.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "offers")
public class Offer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "offer_id", nullable = false)
    private Long id;

    @Transient
    private Conversation conversation;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @NotNull
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @NotNull
    @ColumnDefault("'PENDING'")
    @Column(name = "status", nullable = false)
    private String status;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Compatibility for APIs using proposedPrice name. */
    @Transient
    public BigDecimal getProposedPrice() {
        return amount;
    }

    /** Compatibility for APIs using proposedPrice name. */
    @Transient
    public void setProposedPrice(BigDecimal proposedPrice) {
        this.amount = proposedPrice;
    }

    /** Current schema has no message column yet. */
    @Transient
    public String getMessage() {
        return null;
    }

    /** Current schema has no message column yet. */
    @Transient
    public void setMessage(String ignored) {
        // no-op until message column exists
    }
}