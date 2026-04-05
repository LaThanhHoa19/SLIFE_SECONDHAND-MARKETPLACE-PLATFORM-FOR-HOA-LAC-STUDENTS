/** Giới hạn bài cộng đồng — đồng bộ với CreateCommunityPostRequest / CommunityPostService. */
export const COMMUNITY_POST_MAX_TITLE = 50;
export const COMMUNITY_POST_MAX_DESCRIPTION = 500;
/** Số lần bắt được # trong nội dung (trái → phải); trùng nhau vẫn tính; từ lần 101 trở đi bỏ qua. */
export const COMMUNITY_POST_MAX_HASHTAG_OCCURRENCES = 100;
/** Dung lượng tối đa mỗi ảnh đính kèm — khớp CommunityPostImageService (5MB). */
export const COMMUNITY_POST_MAX_IMAGE_MB = 5;
