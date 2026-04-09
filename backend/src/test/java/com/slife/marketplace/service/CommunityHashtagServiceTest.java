package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.TrendingHashtagResponse;
import com.slife.marketplace.entity.Hashtag;
import com.slife.marketplace.repository.HashtagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityHashtagServiceTest {

    @Mock private HashtagRepository hashtagRepository;

    private CommunityHashtagService service;

    @BeforeEach
    void setUp() {
        service = new CommunityHashtagService(hashtagRepository);
    }

    private static Hashtag tag(String t) {
        Hashtag h = new Hashtag();
        h.setTag(t);
        return h;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("suggest")
    class Suggest {

        @Test
        @DisplayName("q null/blank -> trả trending tags (limit clamp 1..30)")
        void blankQuery_shouldUseTrending() {
            when(hashtagRepository.findTrendingTagsRaw(any(Instant.class), eq(2)))
                    .thenReturn(List.of(new Object[]{"a", 3L}, new Object[]{"b", 1L}));

            List<String> out = service.suggest("   ", 2);

            assertEquals(List.of("a", "b"), out);
        }

        @Test
        @DisplayName("q dài >100 -> truncate; ký tự không hợp lệ -> list rỗng")
        void invalidChars_shouldReturnEmpty() {
            assertTrue(service.suggest("#bad", 10).isEmpty());

            String longBad = "a".repeat(200) + "-";
            assertTrue(service.suggest(longBad, 10).isEmpty());
        }

        @Test
        @DisplayName("q hợp lệ -> query prefix + pageable size clamp")
        void validPrefix_shouldQueryRepo() {
            when(hashtagRepository.findByTagStartingWithOrderByTagAsc(eq("ab"), any(Pageable.class)))
                    .thenReturn(List.of(tag("ab"), tag("abc")));

            List<String> out = service.suggest("  Ab ", 999);

            assertEquals(List.of("ab", "abc"), out);
            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(hashtagRepository).findByTagStartingWithOrderByTagAsc(eq("ab"), cap.capture());
            assertEquals(30, cap.getValue().getPageSize());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("trending")
    class Trending {

        @Test
        @DisplayName("days/limit clamp 1..30; map rows null/thiếu -> skip; count non-number -> 0")
        void trending_shouldMapSafely() {
            when(hashtagRepository.findTrendingTagsRaw(any(Instant.class), eq(30)))
                    .thenReturn(java.util.Arrays.asList(
                            null,
                            new Object[]{null, 1L},
                            new Object[]{"ok", "x"},
                            new Object[]{"good", 5L}
                    ));

            List<TrendingHashtagResponse> out = service.trending(999, 999);

            assertEquals(2, out.size());
            assertEquals(new TrendingHashtagResponse("ok", 0L), out.get(0));
            assertEquals(new TrendingHashtagResponse("good", 5L), out.get(1));
        }
    }
}

