package com.slife.marketplace.dto.response;

import java.util.List;

/**
 * Dữ liệu chuỗi thời gian (30 ngày gần nhất) cho biểu đồ Dashboard admin.
 * Tách endpoint riêng để stats card tải nhanh, charts tải sau không block UI.
 */
public record AdminDashboardChartsResponse(
        List<DailyStatDto> userGrowth,
        List<DailyStatDto> listingGrowth,
        List<DailyStatDto> dealTrend,
        List<DailyStatDto> reportTrend
) {}
