package com.slife.marketplace.integrations.google;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class GoogleOAuthHttpClient implements GoogleOAuthClient {

    private final ObjectMapper objectMapper;

    public GoogleOAuthHttpClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Map<String, Object> verifyIdToken(String idToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + enc(idToken)))
                    .GET()
                    .build();
            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (SlifeException e) {
            throw e;
        } catch (Exception e) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
    }

    @Override
    public Map<String, Object> exchangeCodeForTokens(String code,
                                                     String redirectUri,
                                                     String googleClientId,
                                                     String googleClientSecret) {
        try {
            String body = "code=" + enc(code)
                    + "&client_id=" + enc(googleClientId)
                    + "&client_secret=" + enc(googleClientSecret)
                    + "&redirect_uri=" + enc(redirectUri)
                    + "&grant_type=authorization_code";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (SlifeException e) {
            throw e;
        } catch (Exception e) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
    }
}

