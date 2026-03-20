package com.slife.marketplace.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "listings", indexes = {
        @Index(name = "idx_listings_status", columnList = "status"),
        @Index(name = "idx_listings_category_id", columnList = "category_id"),
        @Index(name = "idx_listings_pickup_address_id", columnList = "pickup_address_id"),
        @Index(name = "idx_listings_status_category", columnList = "status, category_id"),
        @Index(name = "idx_listings_created_at", columnList = "created_at")
})
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "listing_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "pickup_address_id")
    private Address pickupAddress;

    @Size(max = 300)
    @NotNull
    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Lob
    @Column(name = "description")
    private String description;

    @NotNull
    @ColumnDefault("0.00")
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull
    @ColumnDefault("'USED_GOOD'")
    @Column(name = "item_condition", nullable = false)
    private String itemCondition;

    @NotNull
    @ColumnDefault("'DRAFT'")
    @Column(name = "status", nullable = false)
    private String status;

    @NotNull
    @ColumnDefault("'SALE'")
    @Column(name = "purpose", nullable = false)
    private String purpose;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "is_giveaway", nullable = false)
    private Boolean isGiveaway;

    @Column(name = "expiration_date")
    private Instant expirationDate;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "listing", fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<ListingImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "listing", fetch = FetchType.LAZY)
    private List<Offer> offers = new ArrayList<>();
}