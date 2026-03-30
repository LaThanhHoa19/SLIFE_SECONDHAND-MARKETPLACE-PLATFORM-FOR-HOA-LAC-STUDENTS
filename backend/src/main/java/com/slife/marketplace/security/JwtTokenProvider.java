package com.slife.marketplace.security;

import com.slife.marketplace.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final JwtProperties properties;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
    }

    public String generateToken(String subject, Map<String, Object> claims) {
        return generateToken(subject, claims, properties.getExpiration());
    }

    public String generateToken(String subject, Map<String, Object> claims, long expirationMs) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(Math.max(expirationMs, 1000L));

        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public long getRefreshExpirationMs() {
        long configured = properties.getRefreshExpiration();
        return configured > 0 ? configured : 604800000L;
    }

    private Key getSigningKey() {
        String secret = properties.getSecret();
        if (secret == null || secret.isBlank() || "replace-secret".equals(secret)) {
            secret = "slife-dev-secret-key-should-be-long-1234567890";
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
