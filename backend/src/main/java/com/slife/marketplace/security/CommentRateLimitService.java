package com.slife.marketplace.security;

import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CommentRateLimitService {

    private static final Duration MIN_GAP = Duration.ofSeconds(2);
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int MAX_PER_WINDOW = 12;

    private static final String GAP_PREFIX = "comment:gap:";
    private static final String WINDOW_PREFIX = "comment:window:";

    private final StringRedisTemplate redisTemplate;

    public CommentRateLimitService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void assertAllowed(Long userId) {
        if (userId == null) {
            return;
        }
        // Check min gap (2 seconds between comments)
        if (Boolean.TRUE.equals(redisTemplate.hasKey(GAP_PREFIX + userId))) {
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "Too many comment actions. Please wait a moment.");
        }
        // Check window limit (12 per minute)
        String countStr = redisTemplate.opsForValue().get(WINDOW_PREFIX + userId);
        if (countStr != null) {
            int count = Integer.parseInt(countStr);
            if (count >= MAX_PER_WINDOW) {
                throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED,
                        "Comment limit exceeded. Please try again later.");
            }
        }
    }

    public void recordSuccess(Long userId) {
        if (userId == null) {
            return;
        }
        // Set gap key with 2-second TTL
        redisTemplate.opsForValue().set(GAP_PREFIX + userId, "1", MIN_GAP);
        // Increment window counter
        String windowKey = WINDOW_PREFIX + userId;
        Long count = redisTemplate.opsForValue().increment(windowKey);
        if (count != null && count == 1) {
            redisTemplate.expire(windowKey, WINDOW);
        }
    }
}
