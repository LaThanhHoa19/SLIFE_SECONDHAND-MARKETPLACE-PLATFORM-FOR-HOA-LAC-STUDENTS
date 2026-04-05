package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FinalizeDealRequest {
    private boolean completed;

    @Min(1)
    @Max(5)
    private Byte rating;

    private String comment;

    private List<String> tags;
}
