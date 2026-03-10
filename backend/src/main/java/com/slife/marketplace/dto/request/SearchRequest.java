package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * SCRUM-43/47: Basic keyword search request DTO with validation.
 */
@Data
public class SearchRequest {

    /**
     * Keyword to search in title and description (optional).
     */
    private String q;

    /**
     * Optional category filter.
     */
    private Long categoryId;

    /**
     * Optional free-text location filter (e.g. campus, building).
     */
    private String location;

    /**
     * 0-based page index.
     */
    @Min(value = 0, message = "Page index must be >= 0")
    private Integer page = 0;

    /**
     * Page size between 1 and 50 (BR-06).
     */
    @Min(value = 1, message = "Page size must be >= 1")
    @Max(value = 50, message = "Page size must be <= 50")
    private Integer size = 20;
}

