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

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "conversation_id")
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
    @Column(name = "proposed_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal proposedPrice;

    @Lob
    @Column(name = "message")
    private String message;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    @JoinColumn(name = "status_id", nullable = false)
    private OfferStatus offerStatus;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Backward-compatible accessor for existing chat flow code.
     */
    @Transient
    public String getStatus() {
        return offerStatus != null ? offerStatus.getCode() : null;
    }

    /**
     * Backward-compatible mutator for existing chat flow code.
     * The actual status FK must be assigned by service via OfferStatusRepository.
     */
    @Transient
    public void setStatus(String ignored) {
        // no-op by design
    }

    /**
     * Backward-compatible accessor for legacy field name.
     */
    @Transient
    public BigDecimal getAmount() {
        return proposedPrice;
    }

    /**
     * Backward-compatible mutator for legacy field name.
     */
    @Transient
    public void setAmount(BigDecimal amount) {
        this.proposedPrice = amount;
    }
}