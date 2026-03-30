package com.slife.marketplace.security;

import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimitService {

    private static final int MAX_ATTEMPTS = 8;
    private static final Duration WINDOW = Duration.ofMinutes(10);
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);

    private final Map<String, AttemptState> states = new ConcurrentHashMap<>();

    public void assertAllowed(String key) {
        AttemptState state = states.get(key);
        if (state == null) return;
        Instant now = Instant.now();
        if (state.blockedUntil != null && now.isBefore(state.blockedUntil)) {
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "Too many login attempts. Please try again later.");
        }
    }

    public void recordFailure(String key) {
        Instant now = Instant.now();
        states.compute(key, (k, s) -> {
            if (s == null || s.windowStart == null || now.isAfter(s.windowStart.plus(WINDOW))) {
                AttemptState fresh = new AttemptState();
                fresh.windowStart = now;
                fresh.attempts = 1;
                return fresh;
            }
            s.attempts++;
            if (s.attempts >= MAX_ATTEMPTS) {
                s.blockedUntil = now.plus(LOCK_TIME);
            }
            return s;
        });
    }

    public void recordSuccess(String key) {
        states.remove(key);
    }

    private static final class AttemptState {
        private int attempts;
        private Instant windowStart;
        private Instant blockedUntil;
    }
}
