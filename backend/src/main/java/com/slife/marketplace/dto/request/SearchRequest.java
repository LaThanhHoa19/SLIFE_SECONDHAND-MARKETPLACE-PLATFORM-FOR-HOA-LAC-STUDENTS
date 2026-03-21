package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * SCRUM-43/47: Search request with extended filters.
 */
@Data
public class SearchRequest {

    /** Keyword: tim trong title va description */
    @Size(max = 100, message = "Keyword must not exceed 100 characters")
    private String q;

    /** Filter theo category */
    private Long categoryId;

    /** Filter theo pickup location */
    private String location;

    /** Filter theo purpose: SALE | GIVEAWAY | FLASH */
    private String purpose;

    /** Filter theo tinh trang: NEW | USED_LIKE_NEW | USED_GOOD | USED_FAIR */
    private String itemCondition;

    /** Gia toi thieu (VND) */
    @DecimalMin(value = "0", message = "priceMin must be >= 0")
    private BigDecimal priceMin;

    /** Gia toi da (VND) */
    @DecimalMin(value = "0", message = "priceMax must be >= 0")
    private BigDecimal priceMax;

    /** 0-based page index */
    @Min(value = 0, message = "Page index must be >= 0")
    private Integer page = 0;

    /** Page size: 1-50 */
    @Min(value = 1, message = "Page size must be >= 1")
    @Max(value = 50, message = "Page size must be <= 50")
    private Integer size = 20;
    
    /** Sort string (e.g. price,asc) */
    private String sort;
}