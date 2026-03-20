package com.slife.marketplace.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class FirebasePhoneAuthService {

    private final String serviceAccountJson;
    private final String serviceAccountPath;

    private volatile FirebaseAuth firebaseAuth;

    public FirebasePhoneAuthService(
            @Value("${firebase.service-account-json:}") String serviceAccountJson,
            @Value("${firebase.service-account-path:}") String serviceAccountPath
    ) {
        this.serviceAccountJson = serviceAccountJson;
        this.serviceAccountPath = serviceAccountPath;
    }

    private FirebaseAuth getFirebaseAuth() {
        if (firebaseAuth != null) return firebaseAuth;
        synchronized (this) {
            if (firebaseAuth != null) return firebaseAuth;

            if ((serviceAccountJson == null || serviceAccountJson.isBlank())
                    && (serviceAccountPath == null || serviceAccountPath.isBlank())) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Firebase credentials not configured");
            }

            try {
                FirebaseOptions options;
                if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
                    GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(serviceAccountPath));
                    options = FirebaseOptions.builder().setCredentials(credentials).build();
                } else {
                    GoogleCredentials credentials = GoogleCredentials.fromStream(
                            new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8))
                    );
                    options = FirebaseOptions.builder().setCredentials(credentials).build();
                }

                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                }
                firebaseAuth = FirebaseAuth.getInstance();
                return firebaseAuth;
            } catch (Exception e) {
                throw new SlifeException(ErrorCode.INTERNAL_ERROR, "Firebase init failed: " + e.getMessage());
            }
        }
    }

    public String verifyPhoneNumberFromIdToken(String firebaseIdToken) {
        if (firebaseIdToken == null || firebaseIdToken.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Firebase id token is required");
        }

        try {
            FirebaseToken token = getFirebaseAuth().verifyIdToken(firebaseIdToken);
            Map<String, Object> claims = token.getClaims();
            Object phone = claims != null ? claims.get("phone_number") : null;
            return phone != null ? phone.toString() : null;
        } catch (SlifeException e) {
            throw e;
        } catch (Exception e) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Invalid Firebase id token");
        }
    }
}

