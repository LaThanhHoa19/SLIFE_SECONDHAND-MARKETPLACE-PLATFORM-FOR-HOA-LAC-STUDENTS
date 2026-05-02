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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingImageServiceTest {

    @Mock private ListingRepository listingRepository;
    @Mock private ListingImageRepository listingImageRepository;
    @Mock private ConfigService configService;
    @Mock private UserFileStorageService userFileStorage;

    private ListingImageService service;

    @BeforeEach
    void setUp() {
        service = new ListingImageService(listingRepository, listingImageRepository, configService, userFileStorage);
    }

    private static Listing listing(long id, long sellerId) {
        Listing l = new Listing();
        l.setId(id);
        User owner = new User();
        owner.setId(sellerId);
        l.setSeller(owner);
        return l;
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        return u;
    }

    @Nested
    @DisplayName("Function: uploadListingImages")
    class UploadListingImagesGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - files null or empty")
        void utcId01_shouldThrowInvalidInput_whenFilesNullOrEmpty() {
            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> service.uploadListingImages(100L, null, user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());

            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> service.uploadListingImages(100L, List.of(), user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - listing not found")
        void utcId02_shouldThrowListingNotFound_whenListingMissing() {
            when(listingRepository.findById(100L)).thenReturn(Optional.empty());
            MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", "x".getBytes());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadListingImages(100L, List.of(image), user(1L)));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - current user is not owner")
        void utcId03_shouldThrowForbidden_whenCurrentUserNotOwner() {
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
            MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", "x".getBytes());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadListingImages(100L, List.of(image), user(2L)));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Boundary] - exceed max images per post")
        void utcId04_shouldThrowInvalidInput_whenExceedMaxImages() {
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
            when(listingImageRepository.countByListing_Id(100L)).thenReturn(9);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            MockMultipartFile image1 = new MockMultipartFile("images", "a.jpg", "image/jpeg", "x".getBytes());
            MockMultipartFile image2 = new MockMultipartFile("images", "b.jpg", "image/jpeg", "y".getBytes());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadListingImages(100L, List.of(image1, image2), user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
            assertEquals(Constants.MSG18, ex.getMessage());
        }

        @Test
        @DisplayName("UTCID05 [Negative] - file too large")
        void utcId05_shouldThrowFileTooLarge_whenFileExceeds5Mb() {
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
            when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            byte[] big = new byte[(int) (5 * 1024 * 1024 + 1L)];
            MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", big);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadListingImages(100L, List.of(image), user(1L)));
            assertEquals(ErrorCode.FILE_TOO_LARGE, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID06 [Positive] - upload multiple valid files")
        void utcId06_shouldSaveImagesWithIncrementDisplayOrder_whenValidFiles() {
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
            when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            MockMultipartFile a = new MockMultipartFile("images", "a.jpg", "image/jpeg", "a".getBytes());
            MockMultipartFile b = new MockMultipartFile("images", "b.png", "image/png", "b".getBytes());
            when(userFileStorage.storeMultipart(any(), anyString()))
                    .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

            service.uploadListingImages(100L, List.of(a, b), user(1L));

            verify(userFileStorage).storeMultipart(eq(a), argThat(rel -> rel != null && rel.contains("_1.jpg")));
            verify(userFileStorage).storeMultipart(eq(b), argThat(rel -> rel != null && rel.contains("_2.png")));
            ArgumentCaptor<ListingImage> cap = ArgumentCaptor.forClass(ListingImage.class);
            verify(listingImageRepository, times(2)).save(cap.capture());
            assertEquals(1, cap.getAllValues().get(0).getDisplayOrder());
            assertEquals(2, cap.getAllValues().get(1).getDisplayOrder());
            assertNotNull(cap.getAllValues().get(0).getCreatedAt());
        }

        @Test
        @DisplayName("UTCID07 [Positive] - skip null or empty files")
        void utcId07_shouldSkipNullOrEmptyFiles_whenMixedInput() {
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
            when(listingImageRepository.countByListing_Id(100L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            MockMultipartFile empty = new MockMultipartFile("images", "e.jpg", "image/jpeg", new byte[0]);
            MockMultipartFile ok = new MockMultipartFile("images", "a.webp", "image/webp", "x".getBytes());
            when(userFileStorage.storeMultipart(eq(ok), anyString()))
                    .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

            service.uploadListingImages(100L, Arrays.asList(empty, null, ok), user(1L));

            verify(userFileStorage, times(1)).storeMultipart(eq(ok), argThat(rel ->
                    rel != null && rel.startsWith("listings/100_") && rel.endsWith(".webp")));
            verify(listingImageRepository, times(1)).save(any(ListingImage.class));
        }
    }

    @Nested
    @DisplayName("Function: deleteListingImage")
    class DeleteListingImageGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - current user null")
        void utcId01_shouldThrowUnauthorized_whenCurrentUserNull() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deleteListingImage(100L, 1L, null));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - listing not found")
        void utcId02_shouldThrowListingNotFound_whenListingMissing() {
            when(listingRepository.findById(100L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deleteListingImage(100L, 1L, user(1L)));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - current user not owner")
        void utcId03_shouldThrowForbidden_whenCurrentUserNotOwner() {
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deleteListingImage(100L, 1L, user(2L)));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - image not found")
        void utcId04_shouldThrowInvalidInput_whenImageMissing() {
            when(listingRepository.findById(100L)).thenReturn(Optional.of(listing(100L, 1L)));
            when(listingImageRepository.findById(5L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deleteListingImage(100L, 5L, user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID05 [Negative] - image belongs to another listing")
        void utcId05_shouldThrowForbidden_whenImageBelongsToAnotherListing() {
            Listing ownerListing = listing(100L, 1L);
            when(listingRepository.findById(100L)).thenReturn(Optional.of(ownerListing));
            Listing otherListing = listing(200L, 1L);
            ListingImage img = new ListingImage();
            img.setId(5L);
            img.setListing(otherListing);
            img.setImageUrl("/uploads/listings/x.jpg");
            when(listingImageRepository.findById(5L)).thenReturn(Optional.of(img));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deleteListingImage(100L, 5L, user(1L)));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID06 [Positive] - owner deletes image successfully")
        void utcId06_shouldDeleteStoredFileAndDbRow_whenOwnerDeletesImage() {
            Listing ownerListing = listing(100L, 1L);
            when(listingRepository.findById(100L)).thenReturn(Optional.of(ownerListing));
            ListingImage img = new ListingImage();
            img.setId(5L);
            img.setListing(ownerListing);
            img.setImageUrl("https://cdn/x.jpg");
            when(listingImageRepository.findById(5L)).thenReturn(Optional.of(img));

            service.deleteListingImage(100L, 5L, user(1L));

            verify(userFileStorage).deleteStoredIfExists("https://cdn/x.jpg");
            verify(listingImageRepository).delete(img);
            assertTrue(true);
        }
    }
}
