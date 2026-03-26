package com.slife.marketplace.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class BlockId implements Serializable {
    private static final long serialVersionUID = 2450620459728660522L;
    @NotNull
    @Column(name = "blocker_id", nullable = false)
    private Long blockerId;

    @NotNull
    @Column(name = "blocked_id", nullable = false)
    private Long blockedId;


}