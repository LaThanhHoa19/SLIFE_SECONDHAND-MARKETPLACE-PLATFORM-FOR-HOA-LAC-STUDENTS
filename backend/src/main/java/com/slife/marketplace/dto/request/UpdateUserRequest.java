package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 200)
    private String fullName;

    @Size(max = 50)
    private String phoneNumber;

    @Size(max = 2000)
    private String bio;

    @Size(max = 1000)
    private String avatarUrl;

    @Size(max = 1000)
    private String coverImageUrl;
}
