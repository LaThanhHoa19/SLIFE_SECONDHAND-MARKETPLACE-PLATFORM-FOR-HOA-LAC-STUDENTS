package com.slife.marketplace.util;

/**
 * Chuẩn hoá hiển thị địa điểm: tên/địa chỉ từ bản đồ + ghi chú chi tiết (phòng, tầng…).
 */
public final class AddressFormat {

    private AddressFormat() {
    }

    /**
     * @param locationName địa chỉ chính (Vietmap / điểm hẹn)
     * @param addressText  ghi chú thêm do người dùng nhập (có thể null)
     */
    public static String pickupDisplayLine(String locationName, String addressText) {
        String loc = locationName != null ? locationName.trim() : "";
        String det = addressText != null ? addressText.trim() : "";
        if (!loc.isEmpty() && !det.isEmpty()) {
            return loc + " — " + det;
        }
        if (!loc.isEmpty()) {
            return loc;
        }
        if (!det.isEmpty()) {
            return det;
        }
        return null;
    }
}
