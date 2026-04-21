package com.slife.marketplace.security;

import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class LoginRateLimitService {

    private static final int MAX_ATTEMPTS = 8;
    private static final Duration WINDOW = Duration.ofMinutes(10);
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);

    private static final String ATTEMPTS_PREFIX = "login:attempts:";
    private static final String LOCK_PREFIX = "login:lock:";

    private final StringRedisTemplate redisTemplate;

    public LoginRateLimitService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void assertAllowed(String key) {
        if (Boolean.TRUE.equals(redisTemplate.hasKey(LOCK_PREFIX + key))) {
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "Too many login attempts. Please try again later.");
        }
    }

    public void recordFailure(String key) {
        String attemptsKey = ATTEMPTS_PREFIX + key;
        Long count = redisTemplate.opsForValue().increment(attemptsKey);
        if (count != null && count == 1) {
            redisTemplate.expire(attemptsKey, WINDOW);
        }
        if (count != null && count >= MAX_ATTEMPTS) {
            redisTemplate.opsForValue().set(LOCK_PREFIX + key, "1", LOCK_TIME);
            redisTemplate.delete(attemptsKey);
        }
    }

    public void recordSuccess(String key) {
        redisTemplate.delete(ATTEMPTS_PREFIX + key);
        redisTemplate.delete(LOCK_PREFIX + key);
    }
}
