package com.slife.marketplace.security;

import io.jsonwebtoken.Claims;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token blacklist cho logout.
 * Token bi blacklist cho den khi het han (TTL).
 * Scheduled task tu dong don dep token da het han.
 * Luu y: reset khi restart app (chap nhan duoc voi student project).
 */
@Component
public class TokenBlacklistService {

    /** Map<token, expiresAt> */
    private final Map<String, Instant> blacklist = new ConcurrentHashMap<>();

    private final JwtTokenProvider jwtTokenProvider;

    public TokenBlacklistService(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public void blacklist(String token) {
        try {
            Claims claims = jwtTokenProvider.parseToken(token);
            Instant expiry = claims.getExpiration().toInstant();
            blacklist.put(token, expiry);
        } catch (Exception ignored) {
            // Token da het han hoac invalid -> khong can blacklist
        }
    }

    public boolean isBlacklisted(String token) {
        return blacklist.containsKey(token);
    }

    /** Chay moi 5 phut: xoa cac entry da het han */
    @Scheduled(fixedDelay = 300_000)
    public void evictExpired() {
        Instant now = Instant.now();
        blacklist.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}