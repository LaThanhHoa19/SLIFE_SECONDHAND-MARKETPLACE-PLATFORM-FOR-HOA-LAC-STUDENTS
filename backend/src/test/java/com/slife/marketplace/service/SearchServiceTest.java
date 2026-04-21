package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.SearchRequest;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
class SearchServiceTest {

    @Mock
    private ListingRepository listingRepository;
    private SearchService service;

    @BeforeEach
    void setUp() {
        service = new SearchService(listingRepository);
    }

    @Nested
    @DisplayName("Function: search")
    class SearchGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - normalize filters, default paging, subcategory override")
        void utcId01_shouldNormalizeAndUseDefaults() {
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
        @DisplayName("UTCID02 [Boundary] - size below minimum gets clamped to 10")
        void utcId02_shouldClampSizeTo10_whenBelowMinimum() {
            SearchRequest req = new SearchRequest();
            req.setSize(1);
            when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            service.search(req);

            verify(listingRepository).findByFilters(
                    any(), any(), any(), any(), any(), any(), any(), any(),
                    argThat(p -> p.getPageSize() == 10)
            );
        }

        @Test
        @DisplayName("UTCID03 [Boundary] - size above maximum gets clamped to 20")
        void utcId03_shouldClampSizeTo20_whenAboveMaximum() {
            SearchRequest req = new SearchRequest();
            req.setSize(999);
            when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            service.search(req);

            verify(listingRepository).findByFilters(
                    any(), any(), any(), any(), any(), any(), any(), any(),
                    argThat(p -> p.getPageSize() == 20)
            );
        }

        @Test
        @DisplayName("UTCID04 [Positive] - allowed sort field with asc direction")
        void utcId04_shouldParseAllowedSortAsc() {
            SearchRequest req = new SearchRequest();
            req.setSort("price,asc");
            when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            service.search(req);

            verify(listingRepository).findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), argThat(p ->
                    p.getSort().getOrderFor("price") != null
                            && p.getSort().getOrderFor("price").getDirection() == Sort.Direction.ASC));
        }

        @Test
        @DisplayName("UTCID05 [Negative] - invalid purpose and condition become null filters")
        void utcId05_shouldConvertInvalidWhitelistValuesToNull() {
            SearchRequest req = new SearchRequest();
            req.setPurpose("invalid-purpose");
            req.setItemCondition("invalid-condition");
            when(listingRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            service.search(req);

            verify(listingRepository).findByFilters(
                    any(), any(), any(), isNull(), isNull(), any(), any(), any(), any()
            );
        }

        @Test
        @DisplayName("UTCID06 [Negative] - null request throws NullPointerException")
        void utcId06_shouldThrowNpe_whenRequestIsNull() {
            assertThrows(NullPointerException.class, () -> service.search(null));
            verifyNoInteractions(listingRepository);
        }
    }
}

