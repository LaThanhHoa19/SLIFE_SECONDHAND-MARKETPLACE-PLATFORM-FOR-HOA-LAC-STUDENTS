package com.slife.marketplace.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Entity
@Table(name = "offer_statuses")
public class OfferStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_id", nullable = false)
    private Long id;

    @NotNull
    @Size(max = 30)
    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Size(max = 255)
    @Column(name = "label", length = 255)
    private String label;
}
