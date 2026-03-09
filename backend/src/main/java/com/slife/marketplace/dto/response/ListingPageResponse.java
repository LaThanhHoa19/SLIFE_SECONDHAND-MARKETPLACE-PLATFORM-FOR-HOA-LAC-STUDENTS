package com.slife.marketplace.dto.response;

import lombok.Data;

import java.util.List;

/**
 * SCRUM-43: Paged search result for listings.
 */
@Data
public class ListingPageResponse {

    private List<ListingResponse> content;

    private long totalElements;

    private int totalPages;

    private int page;

    private int size;
}

