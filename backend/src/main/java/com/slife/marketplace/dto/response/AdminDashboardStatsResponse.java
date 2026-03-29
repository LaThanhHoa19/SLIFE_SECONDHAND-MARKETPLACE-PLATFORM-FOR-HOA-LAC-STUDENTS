package com.slife.marketplace.dto.response;

/**
 * Thống kê chỉ đọc cho dashboard admin (đếm tổng), không thay đổi nghiệp vụ hiện có.
 */
public record AdminDashboardStatsResponse(
        long listingCount,
        long categoryCount,
        long userCount,
        long reportCount
) {
}
