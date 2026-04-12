# -*- coding: utf-8 -*-
"""
Chuẩn hoá @DisplayName trong service unit tests: tiếng Việt + tiền tố phân loại.
Chạy từ repo root: python backend/scripts/normalize_service_displaynames.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVICE_TEST = ROOT / "src" / "test" / "java" / "com" / "slife" / "marketplace" / "service"

# Thay thế theo thứ tự (chuỗi dài trước)
PHRASES: list[tuple[str, str]] = [
    ("happy path ->", "luồng thành công →"),
    ("Happy path ->", "Luồng thành công →"),
    ("happy path +", "luồng thành công +"),
    ("happy path:", "luồng thành công:"),
    ("Happy path:", "Luồng thành công:"),
    (" happy path", " luồng thành công"),
    ("Happy path", "Luồng thành công"),
    ("happy path", "luồng thành công"),
    ("no overdue -> no saveAll", "không quá hạn → không gọi saveAll"),
    ("no-op", "không thực hiện"),
    ("no save", "không lưu"),
    ("-> swallow", "→ bỏ qua lỗi (không ném ra)"),
    ("swallow", "bỏ qua lỗi"),
    ("invalid targetType", "targetType không hợp lệ"),
    ("duplicate report", "báo cáo trùng"),
    ("report not found", "không tìm thấy báo cáo"),
    ("listing not found", "không tìm thấy tin đăng"),
    ("invalid extension", "phần mở rộng không hợp lệ"),
    ("only supports", "chỉ hỗ trợ"),
    ("admin DTO mapping", "Ánh xạ DTO admin"),
    ("getAdminReportById: not found", "getAdminReportById: không tìm thấy"),
    ("resolve target context for COMMENT image-only", "ngữ cảnh đích COMMENT (chỉ ảnh)"),
    ("normalize type/status + clamp size", "chuẩn hoá type/status + giới hạn size"),
    ("action blank/invalid", "action trống hoặc không hợp lệ"),
    ("close as rejected + audit log (no approve side effects)",
     "đóng dạng từ chối + ghi audit (không áp hiệu ứng duyệt)"),
    ("applyApproveSideEffects", "áp dụng hiệu ứng duyệt"),
    ("map basic fields; reviewer/conversation null-safe",
     "ánh xạ trường cơ bản; an toàn null (reviewer/conversation)"),
    ("map listing fields + first image when exists",
     "ánh xạ tin đăng + ảnh đầu tiên nếu có"),
    ("convertAndSend payload chuẩn", "convertAndSend payload đúng chuẩn"),
    ("listing happy path + evidence image ->",
     "tin đăng — luồng thành công + ảnh bằng chứng →"),
    ("maybe auto-hide", "có thể tự ẩn"),
    ("BAN_USER_APPROVE happy path ->", "BAN_USER_APPROVE — luồng thành công →"),
    ("repo called + attach images + block filter",
     "gọi repository + đính ảnh + lọc chặn"),
    ("-> repo called", "→ gọi repository"),
    ("user có followedIds rỗng -> empty", "followedIds rỗng → kết quả rỗng"),
    ("currentUser null -> empty", "currentUser null → kết quả rỗng"),
    ("FOLLOWING feed:", "Bảng tin đang theo dõi:"),
    ("GIVEAWAY feed:", "Bảng tin cho tặng:"),
    ("POPULAR feed:", "Bảng tin phổ biến:"),
    ("Default feed:", "Bảng tin mặc định:"),
    ("Enrich like metadata", "Bổ sung metadata lượt thích"),
    ("Like enrichment", "Bổ sung lượt thích"),
    ("repository throw DataAccessException",
     "repository ném DataAccessException"),
    ("single-like enrichment throw", "bổ sung like đơn ném"),
    ("fallback likeCount=0, isLiked=false",
     "dự phòng likeCount=0, isLiked=false"),
    ("item id null -> 0/false", "id mục null → 0/false"),
    ("Token typ != refresh", "Token typ khác refresh"),
    ("Token blacklisted hoặc invalid", "Token bị chặn hoặc không hợp lệ"),
    ("Session revoked", "Phiên đã thu hồi"),
    ("simple queries", "Truy vấn đơn giản"),
    ("simple counts/queries", "Đếm / truy vấn đơn giản"),
    ("log methods", "Ghi nhật ký (log)"),
    ("request null -> NullPointerException",
     "request null → NullPointerException"),
    ("verifyNoInteractions", "không tương tác"),
    ("sort parse:", "phân tích sort:"),
    ("invalid field -> fallback", "trường không hợp lệ → dự phòng"),
    ("size clamp:", "giới hạn size:"),
    ("purpose/condition invalid -> null",
     "purpose/condition không hợp lệ → null"),
    ("q/location chỉ khoảng trắng -> truyền null vào repo",
     "q/location chỉ khoảng trắng → truyền null vào repository"),
    ("hợp đồng API: không chấp nhận null",
     "hợp đồng API: không chấp nhận null"),
]

# Tiêu đề @Nested ngắn (chỉ thay nếu toàn bộ chuỗi khớp sau khi strip)
NESTED_TITLES: dict[str, str] = {
    "block": "Nhóm: Chặn người dùng (block)",
    "unblock": "Nhóm: Bỏ chặn (unblock)",
    "list": "Nhóm: Danh sách (list)",
    "toggle": "Nhóm: Bật/tắt like (toggle)",
    "createReport": "Nhóm: Tạo báo cáo",
    "getReports/getAdminReports": "Nhóm: Danh sách báo cáo (admin)",
    "processReport": "Nhóm: Xử lý báo cáo",
    "uploadReportEvidenceImage": "Nhóm: Tải ảnh bằng chứng báo cáo",
    "Mutations": "Nhóm: Follow / unfollow",
    "Lists": "Nhóm: Danh sách follower / following",
    "Simple": "Nhóm: Hành vi đơn giản",
    "Save": "Nhóm: Lưu tin yêu thích",
    "save": "Nhóm: Lưu tin yêu thích",
    "Unsave": "Nhóm: Bỏ lưu tin",
    "unsave": "Nhóm: Bỏ lưu tin",
    "GetSaved": "Nhóm: Tin đã lưu",
    "getSavedListings/isSaved": "Nhóm: Danh sách đã lưu / kiểm tra đã lưu",
    "Upload": "Nhóm: Tải ảnh lên",
    "Delete": "Nhóm: Xóa ảnh",
    "Queries": "Nhóm: Truy vấn (đếm / kiểm tra)",
    "CurrentUser": "Nhóm: Người dùng hiện tại",
    "PhoneVerify": "Nhóm: Xác minh SĐT (Firebase)",
    "Update": "Nhóm: Cập nhật hồ sơ",
    "Uploads": "Nhóm: Avatar / ảnh bìa",
    "GetById": "Nhóm: Lấy user theo id",
    "getUserById": "Nhóm: Lấy user theo id",
    "getCurrentUserEmail/getCurrentUser": "Nhóm: Email & user đăng nhập",
    "markPhoneVerifiedWithFirebase": "Nhóm: Xác minh SĐT Firebase",
    "updateCurrentUser": "Nhóm: Cập nhật thông tin user",
    "uploadAvatar/uploadCover": "Nhóm: Tải avatar / ảnh bìa",
    "getFollowers/getFollowing": "Nhóm: Follower / following",
    "follow/unfollow": "Nhóm: Follow / unfollow",
    "buildProfileForViewer": "Nhóm: Hồ sơ cho người xem",
    "getAllCategories": "Nhóm: Tất cả danh mục",
    "createCategory": "Nhóm: Tạo danh mục",
    "updateCategory": "Nhóm: Sửa danh mục",
    "deleteCategory": "Nhóm: Xóa danh mục",
    "getLikedListings": "Nhóm: Tin đăng đã thích",
    "getLikedFeed": "Nhóm: Bài cộng đồng đã thích (feed)",
    "getBlockedUsers": "Nhóm: Danh sách người bị chặn",
    "suggest": "Nhóm: Gợi ý hashtag",
    "trending": "Nhóm: Hashtag xu hướng",
    "uploadPostImages": "Nhóm: Tải ảnh bài viết",
    "deletePostImage": "Nhóm: Xóa ảnh bài viết",
    "getMaxImagesPerPost": "Nhóm: Giới hạn số ảnh / bài",
    "createPostWithImages": "Nhóm: Tạo bài kèm ảnh",
    "updatePost": "Nhóm: Cập nhật bài viết",
    "softDeletePost": "Nhóm: Xóa mềm bài viết",
    "getFeed": "Nhóm: Feed bài viết",
    "getFeedCursor": "Nhóm: Feed bài (cursor)",
    "getById": "Nhóm: Chi tiết bài theo id",
    "createComment": "Nhóm: Tạo bình luận",
    "replyToComment": "Nhóm: Trả lời bình luận",
    "deleteComment": "Nhóm: Xóa bình luận",
    "updateComment": "Nhóm: Sửa bình luận",
    "getCommentsForPost": "Nhóm: Bình luận theo bài",
    "isBlocked*": "Nhóm: Kiểm tra trạng thái chặn",
}

def translate_phrases(s: str) -> str:
    out = s
    for a, b in PHRASES:
        out = out.replace(a, b)
    return out


def add_category_prefix(s: str) -> str:
    t = s.strip()
    if re.match(r"^\[(Lỗi|Thường|Biên|Nhóm)\]\s", t):
        return s
    if t.startswith("Tính năng:") or t.startswith("Nhóm:") or t.startswith("Ẩn "):
        return s
    err_markers = (
        "NOT_FOUND",
        "FORBIDDEN",
        "INVALID",
        "UNAUTHORIZED",
        "FILE_",
        "RATE_",
        "BLOCKED",
        "DUPLICATE",
        "BANNED",
        "EXCEEDED",
        "NOT_SAVED",
        "ALREADY",
        "NOT_CHAT",
        "NOT_PENDING",
        "REPORT_",
        "DEAL_",
        "OFFER_",
        "CHAT_",
        "LISTING_",
        "COMMUNITY_",
        "SAVED_",
        "FOLLOW_",
        "INTERNAL_",
        "PHONE_",
        "GOOGLE_",
        "INVALID_CREDENTIALS",
        "USER_NOT_FOUND",
        "NullPointerException",
        "MSG18",
    )
    has_arrow = "→" in t or "->" in t
    if has_arrow and any(m in t for m in err_markers):
        return "[Lỗi] " + t
    if "Luồng chính" in t or "luồng thành công" in t:
        return "[Thường] " + t
    return s


def process_display_content(content: str) -> str:
    raw = content.strip()
    if raw in NESTED_TITLES:
        return NESTED_TITLES[raw]
    c = translate_phrases(content.strip())
    c = c.replace(" -> ", " → ")
    c = add_category_prefix(c)
    return c


DISPLAY_RE = re.compile(r'@DisplayName\("((?:\\.|[^"\\])*)"\)')


def java_unescape(s: str) -> str:
    """Bỏ escape Java tối thiểu trong literal."""
    return (
        s.replace("\\\"", '"')
        .replace("\\\\", "\\")
        .replace("\\n", "\n")
        .replace("\\t", "\t")
    )


def java_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("\"", "\\\"")


def process_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    changed = False

    def repl(m: re.Match[str]) -> str:
        nonlocal changed
        inner = m.group(1)
        raw = java_unescape(inner)
        new_inner = process_display_content(raw)
        if new_inner != raw:
            changed = True
        escaped = java_escape(new_inner)
        return f'@DisplayName("{escaped}")'

    new_text = DISPLAY_RE.sub(repl, text)
    if changed:
        path.write_text(new_text, encoding="utf-8")
    return changed


def main() -> None:
    n = 0
    for p in sorted(SERVICE_TEST.rglob("*.java")):
        if process_file(p):
            n += 1
            print("updated:", p.relative_to(ROOT))
    print("files changed:", n)


if __name__ == "__main__":
    main()
