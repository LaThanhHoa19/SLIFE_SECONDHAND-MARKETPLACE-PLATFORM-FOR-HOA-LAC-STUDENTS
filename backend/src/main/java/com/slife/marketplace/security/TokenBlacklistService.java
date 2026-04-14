package com.slife.marketplace.security;

import io.jsonwebtoken.Claims;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Redis-backed token blacklist cho logout.
 * Token bị blacklist cho đến khi hết hạn (TTL tự động xóa bởi Redis).
 * Hoạt động đúng khi scale nhiều instance.
 */
@Component
public class TokenBlacklistService {

    private static final String KEY_PREFIX = "token:blacklist:";

    private final StringRedisTemplate redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    public TokenBlacklistService(StringRedisTemplate redisTemplate,
                                 JwtTokenProvider jwtTokenProvider) {
        this.redisTemplate = redisTemplate;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public void blacklist(String token) {
        try {
            Claims claims = jwtTokenProvider.parseToken(token);
            Instant expiry = claims.getExpiration().toInstant();
            Duration ttl = Duration.between(Instant.now(), expiry);
            if (ttl.isNegative() || ttl.isZero()) {
                return; // Token đã hết hạn, không cần blacklist
            }
            redisTemplate.opsForValue().set(KEY_PREFIX + token, "1", ttl);
        } catch (Exception ignored) {
            // Token đã hết hạn hoặc invalid -> không cần blacklist
        }
    }

    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + token));
    }
}
