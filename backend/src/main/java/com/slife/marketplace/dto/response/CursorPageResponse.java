package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CursorPageResponse<T> {
    private List<T> items;
    /** Opaque cursor to fetch the next page; null when no more. */
    private String nextCursor;
    private boolean hasMore;
}

