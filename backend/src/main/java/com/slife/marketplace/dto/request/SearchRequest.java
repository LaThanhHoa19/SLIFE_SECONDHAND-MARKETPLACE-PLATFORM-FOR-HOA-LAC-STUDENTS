package com.slife.marketplace.dto.request;

import lombok.Data;

/**
 * SCRUM-43: Basic keyword search request DTO.
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
    private Integer page = 0;

    /**
     * Page size.
     */
    private Integer size = 10;
}

