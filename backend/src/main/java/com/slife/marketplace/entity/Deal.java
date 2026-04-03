package com.slife.marketplace.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "deals")
public class Deal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deal_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "proposed_by_id", nullable = false)
    private User proposedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "offer_id")
    private Offer offer;

    @NotNull
    @Column(name = "deal_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal dealPrice;

    @NotNull
    @ColumnDefault("'PENDING'")
    @Column(name = "status", nullable = false)
    private String status; // PENDING, CONFIRMED, COMPLETED, CANCELLED, REJECTED

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "pickup_time")
    private LocalDateTime pickupTime;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "reminder_sent", nullable = false)
    private Boolean reminderSent = false;

    @NotNull
    @Column(name = "created_at", nullable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @NotNull
    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at", columnDefinition = "DATETIME")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (reminderSent == null) reminderSent = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ---- Backward-compatible aliases for existing code paths ----
    @Transient
    public User getBuyer() {
        return proposedBy;
    }

    @Transient
    public void setBuyer(User buyer) {
        this.proposedBy = buyer;
    }

    @Transient
    public User getSeller() {
        return listing != null ? listing.getSeller() : null;
    }

    @Transient
    public void setSeller(User ignored) {
        // Seller is derived from listing.seller in current schema.
    }

    @Transient
    public BigDecimal getOfferedPrice() {
        return dealPrice;
    }

    @Transient
    public void setOfferedPrice(BigDecimal offeredPrice) {
        this.dealPrice = offeredPrice;
    }
}