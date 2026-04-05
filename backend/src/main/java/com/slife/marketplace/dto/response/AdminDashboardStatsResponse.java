package com.slife.marketplace.dto.response;

import java.util.List;

/**
 * Thống kê tổng hợp cho dashboard admin — đếm tổng + breakdown theo trạng thái + top danh mục.
 */
public record AdminDashboardStatsResponse(
        // ── Tổng cộng (giữ nguyên 4 field cũ để không breaking change) ──
        long listingCount,
        long categoryCount,
        long userCount,
        long reportCount,

        // ── Breakdown tin đăng ──
        long listingActive,
        long listingHidden,
        long listingModHidden,
        long listingExpired,
        long listingDraft,

        // ── Breakdown người dùng (role=USER) ──
        long userActive,
        long userBanned,
        long userRestricted,

        // ── Breakdown báo cáo ──
        long reportPending,
        long reportResolved,
        long reportRejected,

        // ── Breakdown giao dịch ──
        long dealPending,
        long dealConfirmed,
        long dealCompleted,
        long dealCancelled,

        // ── Chỉ số chất lượng ──
        double avgReputationScore,

        // ── Top 5 danh mục theo số tin ACTIVE ──
        List<CategoryStatDto> topCategories
) {
}
