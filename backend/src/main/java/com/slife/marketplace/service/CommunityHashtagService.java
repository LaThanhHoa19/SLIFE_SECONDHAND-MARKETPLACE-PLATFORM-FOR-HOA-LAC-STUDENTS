package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.TrendingHashtagResponse;
import com.slife.marketplace.entity.Hashtag;
import com.slife.marketplace.repository.HashtagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CommunityHashtagService {

    private final HashtagRepository hashtagRepository;

    @Transactional(readOnly = true)
    public List<String> suggest(String q, int limit) {
        int lim = Math.min(Math.max(limit, 1), 30);
        if (q == null) {
            q = "";
        }
        String p = q.trim().toLowerCase(Locale.ROOT);
        if (p.length() > 100) {
            p = p.substring(0, 100);
        }
        if (p.isEmpty()) {
            return trending(30, lim).stream().map(TrendingHashtagResponse::getTag).toList();
        }
        if (!p.matches("[\\p{L}\\p{N}_]+")) {
            return List.of();
        }
        return hashtagRepository.findByTagStartingWithOrderByTagAsc(p, PageRequest.of(0, lim)).stream()
                .map(Hashtag::getTag)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TrendingHashtagResponse> trending(int days, int limit) {
        int d = Math.min(Math.max(days, 1), 30);
        int lim = Math.min(Math.max(limit, 1), 30);
        Instant since = Instant.now().minus(d, ChronoUnit.DAYS);
        List<Object[]> rows = hashtagRepository.findTrendingTagsRaw(since, lim);
        List<TrendingHashtagResponse> out = new ArrayList<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }
            String tag = row[0].toString();
            long cnt = row[1] instanceof Number n ? n.longValue() : 0L;
            out.add(new TrendingHashtagResponse(tag, cnt));
        }
        return out;
    }
}
