package com.slife.marketplace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
public class FirebasePhoneVerificationService {
    private static final String LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=";

    private final UserService userService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${firebase.web-api-key:}")
    private String firebaseWebApiKey;

    public FirebasePhoneVerificationService(UserService userService,
                                            UserRepository userRepository,
                                            ObjectMapper objectMapper) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public User verifyIdTokenAndMarkPhone(String idToken) {
        if (firebaseWebApiKey == null || firebaseWebApiKey.isBlank()) {
            throw new SlifeException(ErrorCode.INTERNAL_ERROR, "Firebase web api key is not configured");
        }
        String phoneNumber = resolvePhoneNumber(idToken);
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Firebase token does not contain a verified phone number");
        }

        User user = userService.getCurrentUser();
        user.setPhoneNumber(phoneNumber);
        user.setPhoneVerifiedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private String resolvePhoneNumber(String idToken) {
        try {
            String body = objectMapper.writeValueAsString(java.util.Map.of("idToken", idToken));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(LOOKUP_URL + firebaseWebApiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Firebase token invalid");
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode users = root.path("users");
            if (!users.isArray() || users.isEmpty()) {
                return null;
            }
            return users.get(0).path("phoneNumber").asText(null);
        } catch (SlifeException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Unable to verify Firebase token");
        }
    }
}
