package com.slife.marketplace.util;

import java.time.ZoneId;

/**
 * Múi giờ nghiệp vụ: các cột {@code DATETIME} không offset (ví dụ bảng {@code deals})
 * được lưu theo giờ địa phương Việt Nam.
 */
public final class TimeZones {

    public static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private TimeZones() {}
}
