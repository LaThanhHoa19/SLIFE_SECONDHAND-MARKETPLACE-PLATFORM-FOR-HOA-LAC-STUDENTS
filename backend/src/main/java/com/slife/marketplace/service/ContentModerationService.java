package com.slife.marketplace.service;

import com.slife.marketplace.entity.BannedKeyword;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.BannedKeywordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Kiểm tra nội dung người dùng với danh sách {@code banned_keywords} (chưa xóa mềm).
 */
@Service
public class ContentModerationService {

    private final BannedKeywordRepository bannedKeywordRepository;

    public ContentModerationService(BannedKeywordRepository bannedKeywordRepository) {
        this.bannedKeywordRepository = bannedKeywordRepository;
    }

    /**
     * @param textParts tiêu đề, mô tả, bình luận… — ghép lại rồi so khớp chuỗi con (không phân tách từ).
     */
    @Transactional(readOnly = true)
    public void assertNoBannedKeywords(String... textParts) {
        List<BannedKeyword> keywords = bannedKeywordRepository.findAllByDeletedAtIsNullOrderByKeywordAsc();
        if (keywords.isEmpty()) {
            return;
        }
        StringBuilder sb = new StringBuilder();
        if (textParts != null) {
            for (String p : textParts) {
                if (p != null && !p.isBlank()) {
                    sb.append(p).append(' ');
                }
            }
        }
        if (sb.isEmpty()) {
            return;
        }
        String haystack = sb.toString().toLowerCase(Locale.ROOT);
        for (BannedKeyword bk : keywords) {
            if (bk == null || bk.getKeyword() == null) {
                continue;
            }
            String kw = bk.getKeyword().trim();
            if (kw.isEmpty()) {
                continue;
            }
            if (haystack.contains(kw.toLowerCase(Locale.ROOT))) {
                throw new SlifeException(ErrorCode.BANNED_KEYWORD_IN_CONTENT,
                        "Nội dung chứa từ khóa không được phép đăng trên nền tảng.");
            }
        }
    }
}
