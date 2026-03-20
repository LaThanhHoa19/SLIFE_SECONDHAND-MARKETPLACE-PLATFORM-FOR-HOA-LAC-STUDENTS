package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 200, message = "Full name must not exceed 200 characters")
    private String fullName;

    @Size(max = 50, message = "Phone number must not exceed 50 characters")
    @Pattern(
            regexp = "^$|^(\\+?84|0)(3\\d{8}|5\\d{8}|7\\d{8}|8\\d{8}|9\\d{8})$",
            message = "INVALID_PHONE_FORMAT"
    )
    private String phoneNumber;

    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
    private String bio;

    @Size(max = 1000, message = "Avatar URL must not exceed 1000 characters")
    private String avatarUrl;

    @Size(max = 1000, message = "Cover image URL must not exceed 1000 characters")
    private String coverImageUrl;
}
