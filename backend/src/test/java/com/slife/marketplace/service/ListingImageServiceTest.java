package com.slife.marketplace.service;

import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.util.Constants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingImageServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;

    @Mock
    private ConfigService configService;

    @Mock
    private UserFileStorageService userFileStorage;

    private ListingImageService listingImageService;

    @BeforeEach
    void setUp() {
        listingImageService = new ListingImageService(
                listingRepository,
                listingImageRepository,
                configService,
                userFileStorage
        );
    }

    private static Listing listing(long id, long sellerId) {
        Listing l = new Listing();
        l.setId(id);
        User owner = new User();
        owner.setId(sellerId);
        l.setSeller(owner);
        l.setTitle("T" + id);
        return l;
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        return u;
    }

    @Test
    @DisplayName("[Lỗi] uploadListingImages: currentUser không phải chủ tin → FORBIDDEN")
    void uploadListingImages_whenCurrentUserIsNotOwner_shouldThrowForbidden() {
        Listing listing = listing(100L, 1L);
        User attacker = user(2L);

        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));

        MockMultipartFile image = new MockMultipartFile(
                "images",
                "phone.jpg",
                "image/jpeg",
                "fake-image".getBytes()
        );

        SlifeException ex = assertThrows(
                SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(image), attacker)
        );

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        verify(listingImageRepository, never()).save(ArgumentMatchers.any());
    }

    @Test
    @DisplayName("[Lỗi] uploadListingImages: files null/empty → INVALID_INPUT")
    void uploadListingImages_filesEmpty_shouldThrow() {
        SlifeException ex1 = assertThrows(SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, null, user(1L)));
        assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());

        SlifeException ex2 = assertThrows(SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(), user(1L)));
        assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] uploadListingImages: listing không tồn tại → LISTING_NOT_FOUND")
    void uploadListingImages_listingMissing_shouldThrow() {
        when(listingRepository.findById(100L)).thenReturn(Optional.empty());
        MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", "x".getBytes());
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(image), user(1L)));
        assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] uploadListingImages: currentUser null → FORBIDDEN")
    void uploadListingImages_currentUserNull_shouldThrow() {
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
        MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", "x".getBytes());
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(image), null));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] uploadListingImages: vượt quá giới hạn ảnh → INVALID_INPUT (MSG18)")
    void uploadListingImages_exceedMax_shouldThrow() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(listingImageRepository.countByListing_Id(100L)).thenReturn(9);
        when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
        when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);

        MockMultipartFile image1 = new MockMultipartFile("images", "a.jpg", "image/jpeg", "x".getBytes());
        MockMultipartFile image2 = new MockMultipartFile("images", "b.jpg", "image/jpeg", "y".getBytes());
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(image1, image2), user(1L)));
        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        assertEquals(Constants.MSG18, ex.getMessage());
    }

    @Test
    @DisplayName("[Lỗi] uploadListingImages: ảnh quá lớn → FILE_TOO_LARGE")
    void uploadListingImages_tooLarge_shouldThrow() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
        when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
        when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);

        byte[] big = new byte[(int) (5 * 1024 * 1024 + 1L)];
        MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", big);
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(image), user(1L)));
        assertEquals(ErrorCode.FILE_TOO_LARGE, ex.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] uploadListingImages: storeMultipart lỗi → FILE_UPLOAD_FAILED")
    void uploadListingImages_ioFailure_shouldThrow() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
        when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
        when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
        when(userFileStorage.storeMultipart(any(), anyString()))
                .thenThrow(new SlifeException(ErrorCode.FILE_UPLOAD_FAILED));

        MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", "x".getBytes());
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(image), user(1L)));
        assertEquals(ErrorCode.FILE_UPLOAD_FAILED, ex.getErrorCode());
        verify(listingImageRepository, never()).save(any());
    }

    @Test
    @DisplayName("uploadListingImages: luồng chính → tạo ListingImage + save + gọi UserFileStorageService")
    void uploadListingImages_happyPath_shouldSave() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
        when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
        when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);

        MockMultipartFile image = new MockMultipartFile("images", "a.png", "image/png", "x".getBytes());
        when(userFileStorage.storeMultipart(eq(image), anyString()))
                .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

        listingImageService.uploadListingImages(100L, List.of(image), user(1L));

        verify(userFileStorage).storeMultipart(eq(image), argThat((String rel) ->
                rel != null && rel.startsWith("listings/")));
        ArgumentCaptor<ListingImage> cap = ArgumentCaptor.forClass(ListingImage.class);
        verify(listingImageRepository).save(cap.capture());
        assertEquals(listing, cap.getValue().getListing());
        assertNotNull(cap.getValue().getImageUrl());
        assertTrue(cap.getValue().getImageUrl().startsWith("/uploads/listings/"));
        assertEquals(1, cap.getValue().getDisplayOrder());
        assertNotNull(cap.getValue().getCreatedAt());
    }

    @Test
    @DisplayName("uploadListingImages: nhiều file hợp lệ → displayOrder tăng dần, mỗi file một storeMultipart")
    void uploadListingImages_multipleFiles_incrementsDisplayOrder() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
        when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
        when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);

        MockMultipartFile a = new MockMultipartFile("images", "a.jpg", "image/jpeg", "a".getBytes());
        MockMultipartFile b = new MockMultipartFile("images", "b.png", "image/png", "b".getBytes());
        when(userFileStorage.storeMultipart(any(), anyString()))
                .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

        listingImageService.uploadListingImages(100L, List.of(a, b), user(1L));

        verify(userFileStorage).storeMultipart(eq(a), argThat(rel -> rel != null && rel.contains("_1.jpg")));
        verify(userFileStorage).storeMultipart(eq(b), argThat(rel -> rel != null && rel.contains("_2.png")));
        ArgumentCaptor<ListingImage> cap = ArgumentCaptor.forClass(ListingImage.class);
        verify(listingImageRepository, times(2)).save(cap.capture());
        assertEquals(1, cap.getAllValues().get(0).getDisplayOrder());
        assertEquals(2, cap.getAllValues().get(1).getDisplayOrder());
    }

    @Test
    @DisplayName("uploadListingImages: bỏ qua file null/rỗng, chỉ lưu file còn lại")
    void uploadListingImages_skipsEmptyParts() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
        when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
        when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);

        MockMultipartFile empty = new MockMultipartFile("images", "e.jpg", "image/jpeg", new byte[0]);
        MockMultipartFile ok = new MockMultipartFile("images", "a.webp", "image/webp", "x".getBytes());
        when(userFileStorage.storeMultipart(eq(ok), anyString()))
                .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

        listingImageService.uploadListingImages(100L, Arrays.asList(empty, null, ok), user(1L));

        verify(userFileStorage, times(1)).storeMultipart(eq(ok), argThat(rel ->
                rel != null && rel.startsWith("listings/100_") && rel.endsWith(".webp")));
        verify(listingImageRepository, times(1)).save(any(ListingImage.class));
    }

    @Test
    @DisplayName("[Lỗi] deleteListingImage: currentUser null → UNAUTHORIZED")
    void deleteListingImage_userNull_shouldThrow() {
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.deleteListingImage(100L, 1L, null));
        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] deleteListingImage: listing không tồn tại → LISTING_NOT_FOUND")
    void deleteListingImage_listingMissing_shouldThrow() {
        when(listingRepository.findById(100L)).thenReturn(Optional.empty());
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.deleteListingImage(100L, 1L, user(1L)));
        assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] deleteListingImage: không phải chủ tin → FORBIDDEN")
    void deleteListingImage_notOwner_shouldThrow() {
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.deleteListingImage(100L, 1L, user(2L)));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] deleteListingImage: không tìm thấy image → INVALID_INPUT")
    void deleteListingImage_imageMissing_shouldThrow() {
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
        when(listingImageRepository.findById(5L)).thenReturn(Optional.empty());
        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.deleteListingImage(100L, 5L, user(1L)));
        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    @DisplayName("[Lỗi] deleteListingImage: ảnh không thuộc listing → FORBIDDEN")
    void deleteListingImage_wrongListing_shouldThrow() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        Listing otherListing = listing(200L, 1L);
        ListingImage img = new ListingImage();
        img.setId(5L);
        img.setListing(otherListing);
        img.setImageUrl("/uploads/listings/x.jpg");
        when(listingImageRepository.findById(5L)).thenReturn(Optional.of(img));

        SlifeException ex = assertThrows(SlifeException.class,
                () -> listingImageService.deleteListingImage(100L, 5L, user(1L)));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("deleteListingImage: URL HTTPS → gọi deleteStoredIfExists + delete DB row")
    void deleteListingImage_httpsUrl_shouldCallDeleteStored() {
        Listing listing = listing(100L, 1L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        ListingImage img = new ListingImage();
        img.setId(5L);
        img.setListing(listing);
        img.setImageUrl("https://cdn/x.jpg");
        when(listingImageRepository.findById(5L)).thenReturn(Optional.of(img));

        listingImageService.deleteListingImage(100L, 5L, user(1L));

        verify(userFileStorage).deleteStoredIfExists("https://cdn/x.jpg");
        verify(listingImageRepository, times(1)).delete(img);
    }
}
