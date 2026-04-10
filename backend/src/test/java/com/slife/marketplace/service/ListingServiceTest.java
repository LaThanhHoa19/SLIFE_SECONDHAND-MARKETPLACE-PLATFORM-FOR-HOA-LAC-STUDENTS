/**
 * Mục đích: Test skeleton.
 * TODO: Hoàn thiện kịch bản test theo use case.
 */
package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.MyListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Address;
import com.slife.marketplace.entity.Category;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.AddressRepository;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingLikeRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {
    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;

    @Mock
    private SavedListingRepository savedListingRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private FollowService followService;

    @Mock
    private BlockService blockService;

    @Mock
    private ListingLikeRepository listingLikeRepository;

    @Mock
    private ListingImageService listingImageService;

    @Mock
    private ConfigService configService;
    @Mock
    private NotificationService notificationService;

    @Mock
    private ListingExpiryBatchService listingExpiryBatchService;
    @Mock
    private SystemEmailService systemEmailService;

    @Mock
    private ContentModerationService contentModerationService;

    private ListingService listingService;

    @BeforeEach
    void setUp() {
        listingService = new ListingService(
                listingRepository,
                listingImageRepository,
                savedListingRepository,
                categoryRepository,
                addressRepository,
                followService,
                blockService,
                listingLikeRepository,
                listingImageService,
                configService,
                notificationService,
                listingExpiryBatchService,
                systemEmailService,
                contentModerationService
        );
    }

    @Test
    @DisplayName("Ẩn tin hết hạn: chạy theo batch cho tới khi hết dữ liệu")
    void hideExpiredActiveListings_runsBatchesUntilZero() {
        when(listingExpiryBatchService.hideNextBatch(any(Instant.class))).thenReturn(100, 5, 0);
        assertEquals(105, listingService.hideExpiredActiveListings());
        verify(listingExpiryBatchService, times(3)).hideNextBatch(any(Instant.class));
    }

    // =========================================================================
    // FEATURE: REPOST (CLONE-TO-ACTIVE) — LUỒNG CHÍNH + LUỒNG PHỤ
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Đăng lại (clone-to-active)")
    class RepostCloneToDraft {

    @Test
        @DisplayName("Luồng chính: Tin hết hạn -> tạo listing ACTIVE mới, soft-delete tin nguồn, clone ảnh")
        void repostListing_whenExpired_shouldCreateNewActiveAndCloneImages() {
            // Arrange: seller + listing nguồn đã hết hạn (expirationDate < now) và status EXPIRED/HIDDEN đều ok
        User seller = new User();
            seller.setId(10L);

            Listing source = new Listing();
            source.setId(17L);
            source.setSeller(seller);
            source.setStatus("EXPIRED");
            source.setTitle("Macbook Pro 2019");
            source.setDescription("Còn tốt");
            source.setPrice(new BigDecimal("15000000"));
            source.setItemCondition("USED_GOOD");
            source.setPurpose("SALE");
            source.setIsGiveaway(false);
            source.setExpirationDate(Instant.now().minus(2, ChronoUnit.DAYS));

            when(listingRepository.findById(17L)).thenReturn(Optional.of(source));
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
                Listing fresh = invocation.getArgument(0);
                if (fresh.getId() == null) {
                    fresh.setId(999L);
                }
                return fresh;
            });

            ListingImage img1 = new ListingImage();
            img1.setId(1L);
            img1.setImageUrl("https://cdn/a.jpg");
            img1.setDisplayOrder(0);
            img1.setDeletedAt(null);
            ListingImage img2Deleted = new ListingImage();
            img2Deleted.setId(2L);
            img2Deleted.setImageUrl("https://cdn/b.jpg");
            img2Deleted.setDisplayOrder(1);
            img2Deleted.setDeletedAt(Instant.now()); // ảnh đã xoá -> không clone

            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(17L))
                    .thenReturn(List.of(img1, img2Deleted));
            when(configService.getIntConfigValue(eq("MAX_ACTIVE_LISTINGS_PER_USER"), anyInt())).thenReturn(0);
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(30);

            // Act
            Long newId = listingService.repostListing(17L, seller);

            // Assert: trả về id mới
            assertEquals(999L, newId);

            ArgumentCaptor<Listing> listingCaptor = ArgumentCaptor.forClass(Listing.class);
            verify(listingRepository, times(2)).save(listingCaptor.capture());
            List<Listing> savedListings = listingCaptor.getAllValues();
            Listing savedFresh = savedListings.get(0);
            Listing savedSource = savedListings.get(1);

            assertEquals("ACTIVE", savedFresh.getStatus());
            assertEquals(0L, savedFresh.getViewCount());
            assertNotNull(savedFresh.getCreatedAt());
            assertNotNull(savedFresh.getUpdatedAt());
            assertNotNull(savedFresh.getExpirationDate());
            assertNull(savedFresh.getDeletedAt());
            assertEquals("Macbook Pro 2019", savedFresh.getTitle());
            assertEquals("Còn tốt", savedFresh.getDescription());
            assertEquals(new BigDecimal("15000000"), savedFresh.getPrice());
            assertEquals("USED_GOOD", savedFresh.getItemCondition());
            assertEquals("SALE", savedFresh.getPurpose());

            assertEquals(17L, savedSource.getId());
            assertEquals("DELETED", savedSource.getStatus());
            assertNotNull(savedSource.getDeletedAt());

            // Assert: ảnh được clone (bỏ ảnh deletedAt != null)
            @SuppressWarnings("unchecked")
            ArgumentCaptor<List<ListingImage>> imagesCaptor = ArgumentCaptor.forClass(List.class);
            verify(listingImageRepository).saveAll(imagesCaptor.capture());
            List<ListingImage> cloned = imagesCaptor.getValue();
            assertEquals(1, cloned.size());
            assertEquals("https://cdn/a.jpg", cloned.get(0).getImageUrl());
            assertEquals(0, cloned.get(0).getDisplayOrder());
            assertNotNull(cloned.get(0).getListing());
            assertEquals(999L, cloned.get(0).getListing().getId());
        }

        @Test
        @DisplayName("Luồng phụ: Không tìm thấy tin nguồn -> LISTING_NOT_FOUND")
        void repostListing_whenSourceNotFound_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.repostListing(404L, seller));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng phụ: User không phải chủ tin -> FORBIDDEN")
        void repostListing_whenNotOwner_shouldThrowForbidden() {
            User seller = new User();
            seller.setId(10L);
            User other = new User();
            other.setId(11L);
            Listing source = new Listing();
            source.setId(17L);
            source.setSeller(seller);
            source.setStatus("EXPIRED");
            source.setExpirationDate(Instant.now().minus(1, ChronoUnit.DAYS));
            when(listingRepository.findById(17L)).thenReturn(Optional.of(source));

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.repostListing(17L, other));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: PUBLISH DRAFT (UPDATE LISTING) — LUỒNG CHÍNH + LUỒNG PHỤ
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Publish bản nháp (DRAFT -> ACTIVE)")
    class PublishDraftFlow {

        @Test
        @DisplayName("Luồng chính: updateListing publish draft -> ACTIVE, reset viewCount, bump createdAt/updatedAt, set expirationDate")
        void updateListing_whenPublishingDraft_shouldResetTimestampsAndSetExpiration() {
            // Arrange
            User seller = new User();
            seller.setId(10L);

        Listing listing = new Listing();
            listing.setId(100L);
        listing.setSeller(seller);
            listing.setStatus("DRAFT");
            listing.setCreatedAt(Instant.parse("2025-01-01T00:00:00Z"));
            listing.setUpdatedAt(Instant.parse("2025-01-02T00:00:00Z"));
            listing.setExpirationDate(null);

            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));

            // config listing expiration days
            when(configService.getIntConfigValue(eq("MAX_ACTIVE_LISTINGS_PER_USER"), anyInt())).thenReturn(0);
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(30);

            // category + pickup address: dùng pickupLocationName để resolvePickupAddress -> addressRepository.save()
            com.slife.marketplace.entity.Category cat = new com.slife.marketplace.entity.Category();
            cat.setId(22L);
            when(categoryRepository.findById(22L)).thenReturn(Optional.of(cat));
            when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));

            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false); // publish
            req.setTitle("  New title  ");
            req.setDescription("desc");
            req.setCategoryId(22L);
            req.setPrice(new BigDecimal("1200000"));
            req.setCondition("USED_GOOD");
            req.setPurpose("SALE");
            req.setIsGiveaway(false);
            req.setPickupLocationName("Hòa Lạc");
            req.setPickupAddressSupplement("Dom A");

            // Act
            ListingResponse res = listingService.updateListing(100L, seller, req);

            // Assert: response basic
            assertNotNull(res);
            assertEquals(100L, res.getId());
            assertEquals("ACTIVE", res.getStatus());

            // Assert: entity saved has publish behavior
            ArgumentCaptor<Listing> captor = ArgumentCaptor.forClass(Listing.class);
            verify(listingRepository).save(captor.capture());
            Listing saved = captor.getValue();
            assertEquals("ACTIVE", saved.getStatus());
            assertEquals(0L, saved.getViewCount());
            assertNotNull(saved.getExpirationDate());
            assertNotNull(saved.getCreatedAt());
            assertNotNull(saved.getUpdatedAt());
            // publish sets createdAt == updatedAt (same Instant)
            assertEquals(saved.getCreatedAt(), saved.getUpdatedAt());
        }

        @Test
        @DisplayName("Luồng phụ: publish nhưng thiếu title -> INVALID_INPUT")
        void updateListing_whenPublishMissingTitle_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            Listing listing = new Listing();
            listing.setId(100L);
            listing.setSeller(seller);
            listing.setStatus("DRAFT");
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);
            req.setTitle("   "); // missing
            req.setCategoryId(22L);
            req.setPrice(new BigDecimal("1200000"));
            req.setPickupLocationName("Hòa Lạc");

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.updateListing(100L, seller, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: REPOST (CLONE-TO-DRAFT) — PHỦ NHÁNH BỔ SUNG
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Đăng lại — các nhánh lỗi/edge")
    class RepostEdgeCases {

        @Test
        @DisplayName("MOD_HIDDEN -> không cho đăng lại")
        void repostListing_whenModHidden_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            Listing source = new Listing();
            source.setId(17L);
            source.setSeller(seller);
            source.setStatus("MOD_HIDDEN");
            source.setExpirationDate(Instant.now().minus(1, ChronoUnit.DAYS));
            when(listingRepository.findById(17L)).thenReturn(Optional.of(source));

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.repostListing(17L, seller));
            assertEquals(ErrorCode.LISTING_MOD_HIDDEN_REPOST_FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không hết hạn (ACTIVE + chưa qua expiration) -> LISTING_NOT_EXPIRED")
        void repostListing_whenNotExpired_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            Listing source = new Listing();
            source.setId(17L);
            source.setSeller(seller);
            source.setStatus("ACTIVE");
            source.setExpirationDate(Instant.now().plus(3, ChronoUnit.DAYS));
            when(listingRepository.findById(17L)).thenReturn(Optional.of(source));

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.repostListing(17L, seller));
            assertEquals(ErrorCode.LISTING_NOT_EXPIRED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trạng thái bị chặn (SOLD/BANNED/DELETED/DRAFT/...) -> LISTING_NOT_EXPIRED")
        void repostListing_whenBlockedStatus_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            Listing source = new Listing();
            source.setId(17L);
            source.setSeller(seller);
            source.setStatus("SOLD");
            source.setExpirationDate(Instant.now().minus(2, ChronoUnit.DAYS));
            when(listingRepository.findById(17L)).thenReturn(Optional.of(source));

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.repostListing(17L, seller));
            assertEquals(ErrorCode.LISTING_NOT_EXPIRED, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: CONFIG-DRIVEN LIMITS
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Config giới hạn ảnh / hạn tin")
    class ConfigDrivenLimits {

        @Test
        @DisplayName("getMaxImagesPerPost: lấy min(perPost, systemCap) và clamp >=1")
        void getMaxImagesPerPost_shouldMinAndClamp() {
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(6);
            assertEquals(6, listingService.getMaxImagesPerPost());
        }

        @Test
        @DisplayName("getListingExpirationDays: fallback default + clamp >=1")
        void getListingExpirationDays_shouldClampAtLeastOne() {
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(0);
            assertEquals(1, listingService.getListingExpirationDays());
        }
    }

    // =========================================================================
    // FEATURE: CREATE LISTING (SERVICE LAYER)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Tạo tin (createListing)")
    class CreateListingFlow {

        @Test
        @DisplayName("Chưa đăng nhập: seller null -> UNAUTHORIZED")
        void createListing_whenSellerNull_shouldThrowUnauthorized() {
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.createListing(null, new CreateListingRequest()));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: tạo tin ACTIVE hợp lệ -> lưu + thông báo cho người theo dõi (nếu có)")
        void createListing_whenActiveValid_shouldSaveAndNotifyFollowers() {
            User seller = new User();
            seller.setId(10L);

            Category cat = new Category();
            cat.setId(22L);
            when(categoryRepository.findById(22L)).thenReturn(Optional.of(cat));
            when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(listingLikeRepository.countByListing_Id(anyLong())).thenReturn(0L);
            when(listingLikeRepository.existsByUser_IdAndListing_Id(anyLong(), anyLong())).thenReturn(false);

            when(followService.findFollowerIdsOfUser(10L)).thenReturn(Set.of(1L, 2L));

            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
                Listing l = invocation.getArgument(0);
                l.setId(777L);
                return l;
            });
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(777L)).thenReturn(List.of());

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);
            req.setTitle("  Laptop  ");
            req.setDescription("desc");
            req.setCategoryId(22L);
            req.setPrice(new BigDecimal("1200000"));
            req.setPickupLocationName("Hòa Lạc");
            req.setPickupAddressSupplement("Dom A");

            ListingResponse res = listingService.createListing(seller, req);

            assertNotNull(res);
            assertEquals(777L, res.getId());
            assertEquals("ACTIVE", res.getStatus());
            verify(notificationService).notifyFollowersAboutNewListing(eq(seller), eq(777L), eq("Laptop"), eq(Set.of(1L, 2L)));
        }
    }

    // =========================================================================
    // FEATURE: BUILD LISTING RESPONSE (USED BY SAVED LIST)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Dựng ListingResponse (buildListingResponse)")
    class BuildListingResponseFlow {

        @Test
        @DisplayName("buildListingResponse: gắn isFollowed + followerCount + likes; đính kèm ảnh")
        void buildListingResponse_shouldEnrichSellerAndLikes() {
            User seller = new User();
            seller.setId(10L);
            seller.setFullName("Seller");

            User viewer = new User();
            viewer.setId(20L);

            Listing listing = new Listing();
            listing.setId(100L);
            listing.setSeller(seller);
            listing.setStatus("ACTIVE");
            listing.setTitle("Item");
            listing.setCreatedAt(Instant.now());

            when(followService.isFollowing(20L, 10L)).thenReturn(true);
            when(followService.countFollowers(10L)).thenReturn(123L);
            when(listingLikeRepository.countByListing_Id(100L)).thenReturn(9L);
            when(listingLikeRepository.existsByUser_IdAndListing_Id(20L, 100L)).thenReturn(true);
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(100L)).thenReturn(List.of());

            ListingResponse r = listingService.buildListingResponse(listing, viewer, true);
            assertNotNull(r);
            assertEquals(100L, r.getId());
            assertTrue(r.getIsSaved());
            assertEquals(9L, r.getLikeCount());
            assertTrue(r.getIsLiked());
            assertTrue(r.getIsFollowed());
        @SuppressWarnings("unchecked")
            Map<String, Object> ss = (Map<String, Object>) r.getSellerSummary();
            assertEquals(123L, ss.get("followerCount"));
        }
    }

    // =========================================================================
    // FEATURE: MY LISTINGS (FILTER BY STATUS)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Danh sách tin của tôi (getMyListings)")
    class MyListingsFlow {

        @Test
        @DisplayName("getMyListings: status=REPORTED -> gọi findReportedListingsBySeller")
        void getMyListings_whenReported_shouldUseReportedQuery() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setTitle("t");
            when(listingRepository.findReportedListingsBySeller(eq(u), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(l)));
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
            when(listingRepository.countReportsByListingId(1L)).thenReturn(0L);

            PagedResponse<MyListingResponse> res = listingService.getMyListings("REPORTED", 0, 10, u);
            assertEquals(1, res.getContent().size());
            verify(listingRepository).findReportedListingsBySeller(eq(u), any(Pageable.class));
        }

        @Test
        @DisplayName("getMyListings: status=EXPIRED -> gọi findExpiredListingsBySeller")
        void getMyListings_whenExpired_shouldUseExpiredQuery() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findExpiredListingsBySeller(eq(u), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));
            listingService.getMyListings("EXPIRED", 0, 10, u);
            verify(listingRepository).findExpiredListingsBySeller(eq(u), any(Pageable.class));
        }

        @Test
        @DisplayName("getMyListings: status=HIDDEN -> gọi findHiddenNotExpiredBySeller")
        void getMyListings_whenHidden_shouldUseHiddenNotExpiredQuery() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findHiddenNotExpiredBySeller(eq(u), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));
            listingService.getMyListings("HIDDEN", 0, 10, u);
            verify(listingRepository).findHiddenNotExpiredBySeller(eq(u), any(Pageable.class));
        }

        @Test
        @DisplayName("getMyListings: status=ACTIVE -> gọi findBySellerAndStatus")
        void getMyListings_whenSpecificStatus_shouldUseStatusQuery() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findBySellerAndStatus(eq(u), eq("ACTIVE"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));
            listingService.getMyListings("ACTIVE", 0, 10, u);
            verify(listingRepository).findBySellerAndStatus(eq(u), eq("ACTIVE"), any(Pageable.class));
        }

        @Test
        @DisplayName("getMyListings: status null/blank -> gọi findBySellerOrderByCreatedAtDesc")
        void getMyListings_whenNoStatus_shouldUseDefaultQuery() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findBySellerOrderByCreatedAtDesc(eq(u), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));
            listingService.getMyListings("   ", 0, 10, u);
            verify(listingRepository).findBySellerOrderByCreatedAtDesc(eq(u), any(Pageable.class));
        }
    }

    // =========================================================================
    // FEATURE: HIDE / UNHIDE / SOLD
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Ẩn/Bỏ ẩn/Đánh dấu SOLD")
    class HideUnhideSoldFlow {

        @Test
        @DisplayName("hideListing: ACTIVE -> HIDDEN và save")
        void hideListing_whenActive_shouldHide() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));
            listingService.hideListing(1L, u);
            assertEquals("HIDDEN", l.getStatus());
            verify(listingRepository).save(l);
        }

        @Test
        @DisplayName("hideListing: không ACTIVE -> INVALID_INPUT")
        void hideListing_whenNotActive_shouldThrow() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("HIDDEN");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.hideListing(1L, u));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("hideListing: không tìm thấy -> LISTING_NOT_FOUND")
        void hideListing_whenNotFound_shouldThrow() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.hideListing(404L, u));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("hideListing: không phải chủ tin -> FORBIDDEN")
        void hideListing_whenNotOwner_shouldThrowForbidden() {
            User owner = new User();
            owner.setId(10L);
            User other = new User();
            other.setId(11L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(owner);
            l.setStatus("ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.hideListing(1L, other));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("unhideListing: HIDDEN -> ACTIVE")
        void unhideListing_whenHidden_shouldUnhide() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("HIDDEN");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));
            listingService.unhideListing(1L, u);
            assertEquals("ACTIVE", l.getStatus());
            verify(listingRepository).save(l);
        }

        @Test
        @DisplayName("unhideListing: không tìm thấy -> LISTING_NOT_FOUND")
        void unhideListing_whenNotFound_shouldThrow() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.unhideListing(404L, u));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("unhideListing: không phải chủ tin -> FORBIDDEN")
        void unhideListing_whenNotOwner_shouldThrowForbidden() {
            User owner = new User();
            owner.setId(10L);
            User other = new User();
            other.setId(11L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(owner);
            l.setStatus("HIDDEN");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.unhideListing(1L, other));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("unhideListing: không phải HIDDEN -> INVALID_INPUT")
        void unhideListing_whenNotHidden_shouldThrowInvalid() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.unhideListing(1L, u));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("markSold: ACTIVE/HIDDEN và chưa hết hạn -> SOLD")
        void markSold_whenValid_shouldMarkSold() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().plus(2, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));
            listingService.markSold(1L, u);
            assertEquals("SOLD", l.getStatus());
            verify(listingRepository).save(l);
        }

        @Test
        @DisplayName("markSold: hết hạn -> INVALID_INPUT")
        void markSold_whenExpired_shouldThrow() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().minus(1, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.markSold(1L, u));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("markSold: không tìm thấy -> LISTING_NOT_FOUND")
        void markSold_whenNotFound_shouldThrow() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.markSold(404L, u));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("markSold: không phải chủ tin -> FORBIDDEN")
        void markSold_whenNotOwner_shouldThrowForbidden() {
            User owner = new User();
            owner.setId(10L);
            User other = new User();
            other.setId(11L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(owner);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().plus(1, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.markSold(1L, other));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("markSold: trạng thái không hợp lệ -> INVALID_INPUT")
        void markSold_whenInvalidStatus_shouldThrow() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("BANNED");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.markSold(1L, u));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: RENEW LISTING
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Gia hạn tin (renewListing)")
    class RenewListingFlow {

        @Test
        @DisplayName("renewListing: còn <=7 ngày -> gia hạn expirationDate")
        void renewListing_whenWithin7Days_shouldRenew() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().plus(3, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(30);
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

            listingService.renewListing(1L, u);
            assertNotNull(l.getExpirationDate());
            verify(listingRepository).save(l);
        }

        @Test
        @DisplayName("renewListing: còn >7 ngày -> LISTING_NOT_RENEWABLE")
        void renewListing_whenTooEarly_shouldThrow() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().plus(20, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.renewListing(1L, u));
            assertEquals(ErrorCode.LISTING_NOT_RENEWABLE, ex.getErrorCode());
        }

        @Test
        @DisplayName("renewListing: không tìm thấy -> LISTING_NOT_FOUND")
        void renewListing_whenNotFound_shouldThrow() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.renewListing(404L, u));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("renewListing: không phải chủ tin -> FORBIDDEN")
        void renewListing_whenNotOwner_shouldThrowForbidden() {
            User owner = new User();
            owner.setId(10L);
            User other = new User();
            other.setId(11L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(owner);
            l.setStatus("ACTIVE");
            l.setExpirationDate(Instant.now().plus(3, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.renewListing(1L, other));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("renewListing: status không ACTIVE -> LISTING_NOT_RENEWABLE")
        void renewListing_whenNotActive_shouldThrowNotRenewable() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("HIDDEN");
            l.setExpirationDate(Instant.now().plus(3, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.renewListing(1L, u));
            assertEquals(ErrorCode.LISTING_NOT_RENEWABLE, ex.getErrorCode());
        }

        @Test
        @DisplayName("renewListing: expiry null -> LISTING_NOT_RENEWABLE")
        void renewListing_whenExpiryNull_shouldThrowNotRenewable() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            l.setExpirationDate(null);
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.renewListing(1L, u));
            assertEquals(ErrorCode.LISTING_NOT_RENEWABLE, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: DELETE DRAFT
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Xóa bản nháp (deleteDraft)")
    class DeleteDraftFlow {

        @Test
        @DisplayName("deleteDraft: DRAFT + owner -> delete images then delete listing")
        void deleteDraft_whenValid_shouldDelete() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("DRAFT");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            listingService.deleteDraft(1L, u);

            verify(listingImageRepository).deleteByListing_Id(1L);
            verify(listingRepository).delete(l);
        }

        @Test
        @DisplayName("deleteDraft: không phải DRAFT -> LISTING_NOT_DRAFT")
        void deleteDraft_whenNotDraft_shouldThrow() {
            User u = new User();
            u.setId(10L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(u);
            l.setStatus("ACTIVE");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.deleteDraft(1L, u));
            assertEquals(ErrorCode.LISTING_NOT_DRAFT, ex.getErrorCode());
            verify(listingImageRepository, never()).deleteByListing_Id(anyLong());
        }

        @Test
        @DisplayName("deleteDraft: không tìm thấy -> LISTING_NOT_FOUND")
        void deleteDraft_whenNotFound_shouldThrow() {
            User u = new User();
            u.setId(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.deleteDraft(404L, u));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("deleteDraft: không phải chủ tin -> FORBIDDEN")
        void deleteDraft_whenNotOwner_shouldThrowForbidden() {
            User owner = new User();
            owner.setId(10L);
            User other = new User();
            other.setId(11L);
            Listing l = new Listing();
            l.setId(1L);
            l.setSeller(owner);
            l.setStatus("DRAFT");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.deleteDraft(1L, other));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: GET ACTIVE LISTING CARDS — FOLLOWING WITH USER + IMAGE ATTACH + BLOCK FILTER
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: getActiveListingCards — following + block + attach images")
    class ListingCardsFollowingAndImages {

        @Test
        @DisplayName("FOLLOWING feed: user có followedIds rỗng -> empty")
        void getActiveListingCards_followingNoFollowed_shouldReturnEmpty() {
            User viewer = new User();
            viewer.setId(20L);
            when(followService.findAllFollowedIds(20L)).thenReturn(Set.of());
            PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> res =
                    listingService.getActiveListingCards(0, 10, viewer, null, true, "FOLLOWING", null);
            assertEquals(0, res.getContent().size());
        }

        @Test
        @DisplayName("FOLLOWING feed: user có followedIds -> repo called + attach images + block filter")
        void getActiveListingCards_followingWithFollowed_shouldAttachImagesAndFilterBlocked() {
            User viewer = new User();
            viewer.setId(20L);
            when(followService.findAllFollowedIds(20L)).thenReturn(Set.of(10L));

            com.slife.marketplace.dto.response.ListingCardResponse c1 = new com.slife.marketplace.dto.response.ListingCardResponse();
            c1.setId(1L);
            c1.setSellerId(10L);
            c1.setCreatedAt(Instant.now());
            com.slife.marketplace.dto.response.ListingCardResponse cBlocked = new com.slife.marketplace.dto.response.ListingCardResponse();
            cBlocked.setId(2L);
            cBlocked.setSellerId(99L);
            cBlocked.setCreatedAt(Instant.now());

            when(listingRepository.findFollowingActiveListingCards(eq(Set.of(10L)), any(Instant.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(c1, cBlocked)));

            // non-blocked seller 10, blocked seller 99
            when(blockService.isBlockedEitherDirection(10L, 20L)).thenReturn(false);
            // block seller 99
            when(blockService.isBlockedEitherDirection(99L, 20L)).thenReturn(true);

            // attach images batch: listingImageRepository.findByListingIdIn
            Listing lEntity1 = new Listing();
            lEntity1.setId(1L);
            ListingImage img = new ListingImage();
            img.setListing(lEntity1);
            img.setImageUrl("https://cdn/x.jpg");
            img.setDisplayOrder(0);
            when(listingImageRepository.findByListingIdIn(any())).thenReturn(List.of(img));

            PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> res =
                    listingService.getActiveListingCards(0, 10, viewer, null, true, "FOLLOWING", null);

            assertEquals(1, res.getContent().size());
            assertEquals(1L, res.getContent().get(0).getId());
            assertEquals(List.of("https://cdn/x.jpg"), res.getContent().get(0).getImageUrls());
        }
    }

    // =========================================================================
    // FEATURE: ACTIVE LISTING CARDS (FEED)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Feed listing cards (getActiveListingCards)")
    class ListingCardsFeedFlow {

        @Test
        @DisplayName("FOLLOWING feed: currentUser null -> empty")
        void getActiveListingCards_followingFeedNoUser_shouldReturnEmpty() {
            PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> res =
                    listingService.getActiveListingCards(0, 10, null, null, true, "FOLLOWING", null);
            assertEquals(0, res.getContent().size());
        }

        @Test
        @DisplayName("GIVEAWAY feed: gọi findGiveawayActiveListingCards")
        void getActiveListingCards_giveaway_shouldUseRepo() {
            Page<com.slife.marketplace.dto.response.ListingCardResponse> page = new PageImpl<>(List.of());
            when(listingRepository.findGiveawayActiveListingCards(any(), any(Instant.class), any(Pageable.class))).thenReturn(page);
            PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> res =
                    listingService.getActiveListingCards(0, 10, null, null, false, "GIVEAWAY", null);
            assertNotNull(res);
            verify(listingRepository).findGiveawayActiveListingCards(any(), any(Instant.class), any(Pageable.class));
        }
    }

    // =========================================================================
    // FEATURE: ENRICH LIKE METADATA (PUBLIC WRAPPER)
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Enrich like metadata (enrichWithLikeMetadata)")
    class EnrichLikeMetadataFlow {

        @Test
        @DisplayName("Luồng chính: gắn likeCount/isLiked theo batch counts + likedIds; item id null -> 0/false")
        void enrichWithLikeMetadata_shouldAttachCountsAndLikedFlags() {
            // Arrange
            User viewer = new User();
            viewer.setId(20L);

            ListingResponse a = new ListingResponse();
            a.setId(1L);
            ListingResponse b = new ListingResponse();
            b.setId(2L);
            ListingResponse cNull = new ListingResponse(); // id null

            when(listingLikeRepository.countGroupedByListingId(any())).thenReturn(List.of(
                    new Object[]{1L, 5L},
                    new Object[]{2L, 0L}
            ));
            when(listingLikeRepository.findLikedListingIds(eq(20L), any())).thenReturn(List.of(1L));

            // Act
            listingService.enrichWithLikeMetadata(List.of(a, b, cNull), viewer);

            // Assert
            assertEquals(5L, a.getLikeCount());
            assertTrue(a.getIsLiked());
            assertEquals(0L, b.getLikeCount());
            assertFalse(b.getIsLiked());
            assertEquals(0L, cNull.getLikeCount());
            assertFalse(cNull.getIsLiked());
        }
    }

    // =========================================================================
    // FEATURE: CREATE LISTING WITH IMAGES
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Tạo tin kèm ảnh (createListingWithImages)")
    class CreateListingWithImagesFlow {

        @Test
        @DisplayName("Chưa đăng nhập: seller null -> UNAUTHORIZED")
        void createListingWithImages_whenSellerNull_shouldThrowUnauthorized() {
            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> listingService.createListingWithImages(null, new CreateListingRequest(), List.of())
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng phụ: tạo ACTIVE nhưng không có ảnh -> INVALID_INPUT")
        void createListingWithImages_whenActiveAndNoImages_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false); // ACTIVE

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> listingService.createListingWithImages(seller, req, List.of())
            );
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng phụ: ảnh vượt quá maxPerPost -> INVALID_INPUT")
        void createListingWithImages_whenTooManyImages_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(true); // draft cũng bị giới hạn max

            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(2);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(2);

            MultipartFile f1 = mock(MultipartFile.class);
            MultipartFile f2 = mock(MultipartFile.class);
            MultipartFile f3 = mock(MultipartFile.class);
            when(f1.isEmpty()).thenReturn(false);
            when(f2.isEmpty()).thenReturn(false);
            when(f3.isEmpty()).thenReturn(false);

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> listingService.createListingWithImages(seller, req, List.of(f1, f2, f3))
            );
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: draft + ảnh -> save listing + upload images; draft không notify followers")
        void createListingWithImages_whenDraftWithImages_shouldUploadButNotNotify() {
            User seller = new User();
            seller.setId(10L);

            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            when(listingLikeRepository.countByListing_Id(anyLong())).thenReturn(0L);
            when(listingLikeRepository.existsByUser_IdAndListing_Id(anyLong(), anyLong())).thenReturn(false);

            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
                Listing l = invocation.getArgument(0);
                l.setId(888L);
                return l;
            });
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(888L)).thenReturn(List.of());

            MultipartFile f1 = mock(MultipartFile.class);
            when(f1.isEmpty()).thenReturn(false);

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(true);
            req.setTitle("   "); // draft ok

            ListingResponse res = listingService.createListingWithImages(seller, req, List.of(f1));
            assertNotNull(res);
            assertEquals(888L, res.getId());
            assertEquals("DRAFT", res.getStatus());

            verify(listingImageService).uploadListingImages(eq(888L), eq(List.of(f1)), eq(seller));
            verify(notificationService, never()).notifyFollowersAboutNewListing(any(), any(), any(), any());
        }

        @Test
        @DisplayName("Luồng chính: ACTIVE + ảnh -> save listing + upload images + notify followers (nếu có)")
        void createListingWithImages_whenActiveWithImages_shouldUploadAndNotify() {
            User seller = new User();
            seller.setId(10L);

            // max
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_ACTIVE_LISTINGS_PER_USER"), anyInt())).thenReturn(0);
            // expiration days used inside persistNewListing
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(30);
            // category + pickup
            Category cat = new Category();
            cat.setId(22L);
            when(categoryRepository.findById(22L)).thenReturn(Optional.of(cat));
            when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));
            // followers
            when(followService.findFollowerIdsOfUser(10L)).thenReturn(Set.of(1L));
            // likes enrichment on response
            when(listingLikeRepository.countByListing_Id(anyLong())).thenReturn(0L);
            when(listingLikeRepository.existsByUser_IdAndListing_Id(anyLong(), anyLong())).thenReturn(false);

            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
                Listing l = invocation.getArgument(0);
                l.setId(889L);
                return l;
            });
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(889L)).thenReturn(List.of());

            MultipartFile f1 = mock(MultipartFile.class);
            when(f1.isEmpty()).thenReturn(false);

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);
            req.setTitle("Phone");
            req.setCategoryId(22L);
            req.setPrice(new BigDecimal("1000"));
            req.setPickupLocationName("Hòa Lạc");

            ListingResponse res = listingService.createListingWithImages(seller, req, List.of(f1));
            assertNotNull(res);
            assertEquals("ACTIVE", res.getStatus());

            verify(listingImageService).uploadListingImages(eq(889L), eq(List.of(f1)), eq(seller));
            verify(notificationService).notifyFollowersAboutNewListing(eq(seller), eq(889L), eq("Phone"), eq(Set.of(1L)));
        }

        @Test
        @DisplayName("Luồng phụ: active nhưng file ảnh đều empty -> xem như không có ảnh -> INVALID_INPUT")
        void createListingWithImages_whenAllImagesEmpty_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);

            MultipartFile empty = mock(MultipartFile.class);
            when(empty.isEmpty()).thenReturn(true);

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> listingService.createListingWithImages(seller, req, List.of(empty))
            );
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: UPDATE LISTING — PHỦ NHÁNH BỔ SUNG
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: updateListing — các nhánh lỗi/edge")
    class UpdateListingEdgeCases {

        @Test
        @DisplayName("Chưa đăng nhập: seller null -> UNAUTHORIZED")
        void updateListing_whenSellerNull_shouldThrowUnauthorized() {
            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> listingService.updateListing(1L, null, new CreateListingRequest())
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không tìm thấy: listingId không tồn tại -> LISTING_NOT_FOUND")
        void updateListing_whenNotFound_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> listingService.updateListing(404L, seller, new CreateListingRequest())
            );
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Forbidden: không phải chủ tin -> FORBIDDEN")
        void updateListing_whenNotOwner_shouldThrowForbidden() {
            User owner = new User();
            owner.setId(10L);
            User other = new User();
            other.setId(11L);
            Listing listing = new Listing();
            listing.setId(1L);
            listing.setSeller(owner);
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> listingService.updateListing(1L, other, new CreateListingRequest())
            );
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Draft mode: isDraft=true -> status DRAFT và expirationDate=null")
        void updateListing_whenDraftMode_shouldStayDraftAndNullExpiry() {
            User seller = new User();
            seller.setId(10L);
            Listing listing = new Listing();
            listing.setId(1L);
            listing.setSeller(seller);
            listing.setStatus("ACTIVE");
            listing.setExpirationDate(Instant.now().plus(10, ChronoUnit.DAYS));
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(true);
            req.setTitle("  "); // draft ok

            ListingResponse res = listingService.updateListing(1L, seller, req);
            assertNotNull(res);
            assertEquals("DRAFT", listing.getStatus());
            assertNull(listing.getExpirationDate());
        }

        @Test
        @DisplayName("Backfill legacy ACTIVE: status ACTIVE nhưng expirationDate null -> set expirationDate")
        void updateListing_whenActiveLegacyMissingExpiry_shouldBackfill() {
            User seller = new User();
            seller.setId(10L);
            Listing listing = new Listing();
            listing.setId(1L);
            listing.setSeller(seller);
            listing.setStatus("ACTIVE");
            listing.setExpirationDate(null);
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
            when(configService.getIntConfigValue(eq("LISTING_EXPIRATION"), anyInt())).thenReturn(30);
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);
            req.setTitle("T");
            req.setCategoryId(22L);
            req.setPrice(new BigDecimal("1"));
            req.setPickupLocationName("Hòa Lạc");
            // category + address for publish payload
            Category cat = new Category();
            cat.setId(22L);
            when(categoryRepository.findById(22L)).thenReturn(Optional.of(cat));
            when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ListingResponse res = listingService.updateListing(1L, seller, req);
            assertNotNull(res);
            assertNotNull(listing.getExpirationDate());
        }

        @Test
        @DisplayName("Publish: categoryId không tồn tại -> INVALID_INPUT")
        void updateListing_whenCategoryNotFound_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            Listing listing = new Listing();
            listing.setId(1L);
            listing.setSeller(seller);
            listing.setStatus("DRAFT");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
            when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);
            req.setTitle("T");
            req.setCategoryId(99L);
            req.setPrice(new BigDecimal("1"));
            req.setPickupLocationName("Hòa Lạc");

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.updateListing(1L, seller, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Publish: thiếu pickupLocationName và pickupAddressId -> INVALID_INPUT")
        void updateListing_whenMissingPickup_shouldThrow() {
            User seller = new User();
            seller.setId(10L);
            Listing listing = new Listing();
            listing.setId(1L);
            listing.setSeller(seller);
            listing.setStatus("DRAFT");
            when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
            Category cat = new Category();
            cat.setId(22L);
            when(categoryRepository.findById(22L)).thenReturn(Optional.of(cat));

            CreateListingRequest req = new CreateListingRequest();
            req.setIsDraft(false);
            req.setTitle("T");
            req.setCategoryId(22L);
            req.setPrice(new BigDecimal("1"));
            req.setPickupLocationName("   "); // missing

            SlifeException ex = assertThrows(SlifeException.class, () -> listingService.updateListing(1L, seller, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // =========================================================================
    // FEATURE: LIKE ENRICHMENT — DATAACCESS EXCEPTION PATHS
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: Like enrichment — khi DB like unavailable")
    class LikeEnrichmentDataAccessFailures {

        @Test
        @DisplayName("enrichWithLikeMetadata: repository throw DataAccessException -> fallback likeCount=0, isLiked=false")
        void enrichWithLikeMetadata_whenRepoThrows_shouldFallback() {
            User viewer = new User();
            viewer.setId(20L);
            ListingResponse a = new ListingResponse();
            a.setId(1L);

            when(listingLikeRepository.countGroupedByListingId(any()))
                    .thenThrow(new DataAccessResourceFailureException("down"));

            // Act
            listingService.enrichWithLikeMetadata(List.of(a), viewer);

            // Assert: fallback inside likeCountsForListingIds
            assertEquals(0L, a.getLikeCount());
            assertFalse(a.getIsLiked());
        }

        @Test
        @DisplayName("buildListingResponse: single-like enrichment throw DataAccessException -> likeCount=0, isLiked=false")
        void buildListingResponse_whenSingleLikeRepoThrows_shouldFallback() {
            User seller = new User();
            seller.setId(10L);
            User viewer = new User();
            viewer.setId(20L);
            Listing listing = new Listing();
            listing.setId(1L);
            listing.setSeller(seller);
            listing.setCreatedAt(Instant.now());

            when(listingLikeRepository.countByListing_Id(1L))
                    .thenThrow(new DataAccessResourceFailureException("down"));
            when(listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());

            ListingResponse r = listingService.buildListingResponse(listing, viewer, false);
            assertEquals(0L, r.getLikeCount());
            assertFalse(r.getIsLiked());
        }
    }

    // =========================================================================
    // FEATURE: GET ACTIVE LISTING CARDS — PHỦ NHÁNH BỔ SUNG
    // =========================================================================
    @Nested
    @DisplayName("Tính năng: getActiveListingCards — các nhánh feed khác")
    class ListingCardsAdditionalBranches {

        @Test
        @DisplayName("POPULAR feed: gọi findPopularActiveListingCards")
        void getActiveListingCards_popular_shouldUseRepo() {
            Page<com.slife.marketplace.dto.response.ListingCardResponse> page = new PageImpl<>(List.of());
            when(listingRepository.findPopularActiveListingCards(any(), any(Instant.class), any(Pageable.class))).thenReturn(page);
            PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> res =
                    listingService.getActiveListingCards(0, 10, null, null, false, "POPULAR", null);
            assertNotNull(res);
            verify(listingRepository).findPopularActiveListingCards(any(), any(Instant.class), any(Pageable.class));
        }

        @Test
        @DisplayName("Default feed: gọi findAllActiveListingCards")
        void getActiveListingCards_default_shouldUseRepo() {
            Page<com.slife.marketplace.dto.response.ListingCardResponse> page = new PageImpl<>(List.of());
            when(listingRepository.findAllActiveListingCards(any(), any(Instant.class), any(Pageable.class))).thenReturn(page);
            PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> res =
                    listingService.getActiveListingCards(0, 10, null, null, false, "NEWEST", null);
            assertNotNull(res);
            verify(listingRepository).findAllActiveListingCards(any(), any(Instant.class), any(Pageable.class));
        }
    }
}
