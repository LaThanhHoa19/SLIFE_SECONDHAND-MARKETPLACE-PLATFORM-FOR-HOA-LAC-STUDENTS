package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.SearchRequest;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
/**
 * Unit test cho {@link SearchService}.
 *
 * Mục tiêu:
 * - Xác nhận các quy tắc chuẩn hoá input (q/location), whitelist (purpose/condition),
 *   clamp page/size, và parse sort.
 * - Đảm bảo service truyền đúng tham số vào {@link ListingRepository#findByFilters}.
 *
 * Lưu ý: Đây là unit test thuần logic + verify args, không kiểm tra SQL/JPA thực thi.
 */
class SearchServiceTest {

    @Mock private ListingRepository listingRepository;
    private SearchService service;

    @BeforeEach
    void setUp() {
        service = new SearchService(listingRepository);
    }

    @Test
    @DisplayName("default page/size/sort; normalize q/location; purpose/condition whitelist; subcategory override")
    void search_shouldNormalizeAndClamp() {
        SearchRequest req = new SearchRequest();
        req.setPage(-1);
        req.setSize(null);
        req.setSort(null);
        req.setQ("  Hello  ");
        req.setLocation("  Ha Noi ");
        req.setPurpose("sale");
        req.setItemCondition("USED_GOOD");
        req.setCategoryId(1L);
        req.setSubcategoryId(2L);
        req.setPriceMin(BigDecimal.ONE);
        req.setPriceMax(BigDecimal.TEN);

        Page<Listing> outPage = new PageImpl<>(List.of());
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(outPage);

        Page<Listing> out = service.search(req);
        assertSame(outPage, out);

        ArgumentCaptor<Pageable> pageableCap = ArgumentCaptor.forClass(Pageable.class);
        verify(listingRepository).findByFilters(
                eq("hello"),
                eq(2L),
                eq("ha noi"),
                eq("SALE"),
                eq("USED_GOOD"),
                eq(BigDecimal.ONE),
                eq(BigDecimal.TEN),
                any(),
                pageableCap.capture()
        );
        Pageable pageable = pageableCap.getValue();
        assertEquals(0, pageable.getPageNumber());
        assertEquals(20, pageable.getPageSize());
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), pageable.getSort());
    }

    @Test
    @DisplayName("giới hạn size: <10 → 10; >20 → 20")
    void sizeClamp_shouldWork() {
        SearchRequest req = new SearchRequest();
        req.setSize(1);
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));
        service.search(req);
        verify(listingRepository).findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), argThat(p -> p.getPageSize() == 10));

        SearchRequest req2 = new SearchRequest();
        req2.setSize(999);
        service.search(req2);
        verify(listingRepository).findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), argThat(p -> p.getPageSize() == 20));
    }

    @Test
    @DisplayName("phân tích sort: trường không hợp lệ → dự phòng createdAt (direction vẫn theo input)")
    void sortParse_invalidField_fallbackCreatedAt() {
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));

        SearchRequest req = new SearchRequest();
        req.setSort("nope,asc");
        service.search(req);
        verify(listingRepository).findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), argThat(p ->
                p.getSort().getOrderFor("createdAt") != null
                        && p.getSort().getOrderFor("createdAt").getDirection() == Sort.Direction.ASC));
    }

    @Test
    @DisplayName("phân tích sort: allowed field + asc")
    void sortParse_allowedField_asc() {
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));

        SearchRequest req = new SearchRequest();
        req.setSort("price,asc");
        service.search(req);
        verify(listingRepository).findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), argThat(p ->
                p.getSort().getOrderFor("price") != null
                        && p.getSort().getOrderFor("price").getDirection() == Sort.Direction.ASC));
    }

    @Test
    @DisplayName("purpose/condition không hợp lệ → null (no filter)")
    void invalidPurposeCondition_shouldBecomeNull() {
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));

        SearchRequest req = new SearchRequest();
        req.setPurpose("xxx");
        req.setItemCondition("yyy");
        service.search(req);

        verify(listingRepository).findByFilters(any(), any(), any(), isNull(), isNull(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[Lỗi] request null → NullPointerException (hợp đồng API: không chấp nhận null)")
    void search_nullRequest_throwsNpe() {
        assertThrows(NullPointerException.class, () -> service.search(null));
        verifyNoInteractions(listingRepository);
    }

    @Test
    @DisplayName("q/location chỉ khoảng trắng → truyền null vào repository")
    void blankQAndLocation_normalizedToNull() {
        when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));
        SearchRequest req = new SearchRequest();
        req.setQ("   \t");
        req.setLocation("");
        service.search(req);
        verify(listingRepository).findByFilters(isNull(), any(), isNull(), any(), any(), any(), any(), any(), any());
    }
}

