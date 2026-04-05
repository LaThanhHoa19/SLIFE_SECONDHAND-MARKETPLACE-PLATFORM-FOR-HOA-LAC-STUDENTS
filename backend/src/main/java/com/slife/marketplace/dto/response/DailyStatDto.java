package com.slife.marketplace.dto.response;

/**
 * Điểm thống kê theo ngày dùng cho biểu đồ đường / cột trên Dashboard admin.
 * date: "yyyy-MM-dd", count: số lượng sự kiện hôm đó.
 */
public record DailyStatDto(String date, long count) {}
