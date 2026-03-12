/**
 * Mục đích: Test skeleton.
 * TODO: Hoàn thiện kịch bản test theo use case.
 */
package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Address;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;


@ExtendWith(MockitoExtension.class)
class ListingServiceTest {
    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;


    private ListingService listingService;

    @BeforeEach
    void setUp() {
        listingService = new ListingService(listingRepository, listingImageRepository);
    }


    @Test
    void getFilteredListings_shouldReturnPagedListingResponses() {
        User seller = new User();
        seller.setId(1L);
        seller.setFullName("Alice");
        seller.setAvatarUrl("https://example.com/alice.jpg");

        Listing listing = new Listing();
        listing.setId(10L);
        listing.setTitle("iPhone 12");
        listing.setSeller(seller);
        listing.setDescription("Máy còn dùng ổn");
        listing.setPrice(new BigDecimal("5000000"));
        listing.setItemCondition("USED_GOOD");
        listing.setStatus("ACTIVE");
        listing.setIsGiveaway(false);
        listing.setCreatedAt(Instant.parse("2025-01-01T10:00:00Z"));

        Address address = new Address();
        address.setLocationName("Hòa Lạc");
        listing.setPickupAddress(address);

        ListingImage image = new ListingImage();
        image.setImageUrl("https://example.com/iphone.jpg");

        Page<Listing> pageData = new PageImpl<>(List.of(listing));
        when(listingRepository.findByFilters(isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(pageData);
        when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(10L))
                .thenReturn(List.of(image));

        PagedResponse<ListingResponse> result = listingService.getFilteredListings(
                null,
                null,
                null,
                "createdAt,desc",
                0,
                10,
                null
        );


        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getTotalElements());

        ListingResponse listingResponse = result.getContent().get(0);
        assertEquals(10L, listingResponse.getId());
        assertEquals("iPhone 12", listingResponse.getTitle());
        assertEquals(List.of("https://example.com/iphone.jpg"), listingResponse.getImages());
        assertEquals("Máy còn dùng ổn", listingResponse.getDescription());
        assertEquals(new BigDecimal("5000000"), listingResponse.getPrice());
        assertEquals("USED_GOOD", listingResponse.getCondition());
        assertEquals("Hòa Lạc", listingResponse.getLocation());
        assertEquals(Instant.parse("2025-01-01T10:00:00Z"), listingResponse.getCreatedAt());

        @SuppressWarnings("unchecked")
        Map<String, Object> sellerSummary = (Map<String, Object>) listingResponse.getSellerSummary();
        assertEquals(1L, sellerSummary.get("userId"));
        assertEquals("Alice", sellerSummary.get("fullName"));
        assertFalse(listingResponse.getIsSaved());
        assertFalse(listingResponse.getIsFollowed());
    }

    // =========================================================================
    // FEATURE: QUẢN LÝ PHÂN TRANG VÀ AN TOÀN DỮ LIỆU (PAGINATION & SAFETY)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: An toàn phân trang và Sắp xếp")
    class PaginationAndSortingSafety {

        @Test
        @DisplayName("Hệ thống phải tự điều chỉnh khi tham số phân trang nằm ngoài phạm vi cho phép")
        void should_SanitizePagination_When_InputIsOutOfRange() {
            // GIVEN: Người dùng truyền page âm (-1) và size quá lớn (100)
            when(listingRepository.findByFilters(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            // WHEN
            listingService.getFilteredListings(null, null, null, null, -1, 100, null);

            // THEN: Hệ thống tự đưa về page 0 và size 20 (giới hạn tối đa)
            org.mockito.ArgumentCaptor<Pageable> captor = org.mockito.ArgumentCaptor.forClass(Pageable.class);
            verify(listingRepository).findByFilters(any(), any(), any(), captor.capture());

            assertEquals(0, captor.getValue().getPageNumber());
            assertEquals(20, captor.getValue().getPageSize());
        }

        @Test
        @DisplayName("Hệ thống phải dùng sắp xếp mặc định (createdAt, DESC) khi người dùng truyền field không hợp lệ")
        void should_FallbackToDefaultSort_When_InvalidFieldProvided() {
            // GIVEN: Field 'password' là field bị cấm/không tồn tại
            when(listingRepository.findByFilters(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            // WHEN
            listingService.getFilteredListings(null, null, null, "password,asc", 0, 10, null);

            // THEN: Kết quả phải là createdAt: DESC (Sau khi bạn đã sửa logic code chính)
            org.mockito.ArgumentCaptor<Pageable> captor = org.mockito.ArgumentCaptor.forClass(Pageable.class);
            verify(listingRepository).findByFilters(any(), any(), any(), captor.capture());

            assertEquals("createdAt: DESC", captor.getValue().getSort().toString());
        }

        @Test
        @DisplayName("Hệ thống phải chấp nhận hướng sắp xếp tăng dần (ASC) nếu field hợp lệ")
        void should_ApplyAscendingOrder_When_ValidFieldAndDirectionProvided() {
            when(listingRepository.findByFilters(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            listingService.getFilteredListings(null, null, null, "price,asc", 0, 10, null);

            org.mockito.ArgumentCaptor<Pageable> captor = org.mockito.ArgumentCaptor.forClass(Pageable.class);
            verify(listingRepository).findByFilters(any(), any(), any(), captor.capture());

            assertEquals("price: ASC", captor.getValue().getSort().toString());
        }
    }

    // =========================================================================
    // FEATURE: CHUẨN HÓA THAM SỐ TÌM KIẾM (SEARCH NORMALIZATION)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Chuẩn hóa dữ liệu tìm kiếm")
    class SearchNormalization {

        @Test
        @DisplayName("Hệ thống phải loại bỏ khoảng trắng thừa và chuyển chuỗi trống thành null")
        void should_NormalizeInputParams_When_Searching() {
            when(listingRepository.findByFilters(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            // WHEN: Truyền chuỗi có khoảng trắng và chuỗi chỉ có dấu cách
            listingService.getFilteredListings(1L, "  Hoa Lac  ", "   ", null, 0, 10, null);

            // THEN: Repo nhận được "Hoa Lac" (đã trim) và null (thay vì "   ")
            verify(listingRepository).findByFilters(eq(1L), eq("Hoa Lac"), isNull(), any());
        }

        @Test
        @DisplayName("Hệ thống phải xử lý an toàn khi các tham số tìm kiếm hoàn toàn null")
        void should_HandleNullParams_Gracefully() {
            when(listingRepository.findByFilters(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            listingService.getFilteredListings(null, null, null, null, 0, 10, null);

            verify(listingRepository).findByFilters(isNull(), isNull(), isNull(), any());
        }
    }

    // =========================================================================
    // FEATURE: HIỂN THỊ THÔNG TIN CHI TIẾT (INFORMATION RESOLVING)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Hiển thị thông tin địa điểm và người bán")
    class InformationMapping {

        @Test
        @DisplayName("Nên hiển thị AddressText nếu LocationName bị trống")
        void should_FallbackToAddressText_When_LocationNameIsBlank() {
            Listing listing = new Listing();
            Address address = new Address();
            address.setLocationName("");
            address.setAddressText("Ký túc xá Dom A");
            listing.setPickupAddress(address);

            when(listingRepository.findByFilters(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of(listing)));

            PagedResponse<ListingResponse> result = listingService.getFilteredListings(null, null, null, null, 0, 10, null);

            assertEquals("Ký túc xá Dom A", result.getContent().get(0).getLocation());
        }

        @Test
        @DisplayName("Nên xử lý an toàn (trả về null) khi Listing thiếu địa chỉ hoặc người bán")
        void should_ReturnNull_When_MandatoryFieldsAreMissing() {
            Listing listing = new Listing();
            listing.setSeller(null);
            listing.setPickupAddress(null);

            when(listingRepository.findByFilters(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of(listing)));

            PagedResponse<ListingResponse> result = listingService.getFilteredListings(null, null, null, null, 0, 10, null);

            assertNull(result.getContent().get(0).getSellerSummary());
            assertNull(result.getContent().get(0).getLocation());
        }
    }
}