package com.slife.marketplace.service;

import java.util.Locale;

public enum NotificationScope {
    ALL,
    COMMUNITY,
    MARKET;

    public static NotificationScope from(String raw) {
        if (raw == null || raw.isBlank()) return ALL;
        String v = raw.trim().toUpperCase(Locale.ROOT);
        return switch (v) {
            case "COMMUNITY" -> COMMUNITY;
            case "MARKET", "SHOP" -> MARKET;
            default -> ALL;
        };
    }
}
