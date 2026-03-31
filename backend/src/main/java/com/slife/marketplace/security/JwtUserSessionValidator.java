package com.slife.marketplace.security;

import com.slife.marketplace.entity.User;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;

/**
 * Kiểm tra JWT còn khớp user trong DB: trạng thái BANNED và token_revision (tv).
 */
@Component
public class JwtUserSessionValidator {

    public boolean isAccessAllowed(Claims claims, User user) {
        if (user == null) {
            return false;
        }
        if (isBanned(user)) {
            return false;
        }
        long claimTv = parseTokenRevision(claims);
        long dbTv = user.getTokenRevision() == null ? 0L : user.getTokenRevision();
        return claimTv == dbTv;
    }

    public static long parseTokenRevision(Claims claims) {
        Object raw = claims.get("tv");
        if (raw == null) {
            return 0L;
        }
        if (raw instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(raw.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    public static boolean isBanned(User user) {
        return user.getStatus() != null && "BANNED".equalsIgnoreCase(user.getStatus().trim());
    }
}
