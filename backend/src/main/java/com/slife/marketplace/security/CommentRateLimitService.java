package com.slife.marketplace.security;

import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CommentRateLimitService {

    private static final Duration MIN_GAP = Duration.ofSeconds(2);
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int MAX_PER_WINDOW = 12;

    private final Map<Long, State> states = new ConcurrentHashMap<>();

    public void assertAllowed(Long userId) {
        if (userId == null) {
            return;
        }
        State state = states.get(userId);
        if (state == null) {
            return;
        }
        Instant now = Instant.now();
        if (state.lastAttemptAt != null && now.isBefore(state.lastAttemptAt.plus(MIN_GAP))) {
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "Too many comment actions. Please wait a moment.");
        }
        if (state.windowStart != null && !now.isAfter(state.windowStart.plus(WINDOW)) && state.attempts >= MAX_PER_WINDOW) {
            throw new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "Comment limit exceeded. Please try again later.");
        }
    }

    public void recordSuccess(Long userId) {
        if (userId == null) {
            return;
        }
        Instant now = Instant.now();
        states.compute(userId, (id, current) -> {
            State s = current == null ? new State() : current;
            if (s.windowStart == null || now.isAfter(s.windowStart.plus(WINDOW))) {
                s.windowStart = now;
                s.attempts = 0;
            }
            s.attempts++;
            s.lastAttemptAt = now;
            return s;
        });
    }

    private static final class State {
        private int attempts;
        private Instant windowStart;
        private Instant lastAttemptAt;
    }
}
