package com.slife.marketplace.service;

import org.springframework.stereotype.Service;

@Service
public class StudentVerificationService {

    private static final String ALLOWED_DOMAIN = "@fpt.edu.vn";

    public boolean isAllowedStudentEmail(String email) {
        if (email == null) {
            return false;
        }
        String lower = email.toLowerCase();
        return lower.endsWith(ALLOWED_DOMAIN);
    }
}

