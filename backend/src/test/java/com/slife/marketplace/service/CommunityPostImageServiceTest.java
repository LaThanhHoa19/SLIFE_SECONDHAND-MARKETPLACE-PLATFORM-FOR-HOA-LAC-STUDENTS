package com.slife.marketplace.service;

import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostImageRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
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

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommunityPostImageServiceTest {

    @Mock private CommunityPostRepository postRepository;
    @Mock private CommunityPostImageRepository imageRepository;
    @Mock private ConfigService configService;
    @Mock private UserFileStorageService userFileStorage;

    private CommunityPostImageService service;

    @BeforeEach
    void setUp() {
        service = new CommunityPostImageService(postRepository, imageRepository, configService, userFileStorage);
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        return u;
    }

    private static CommunityPost post(long id, User author) {
        CommunityPost p = new CommunityPost();
        p.setId(id);
        p.setAuthor(author);
        p.setStatus(CommunityPost.STATUS_ACTIVE);
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        return p;
    }

    private static MockMultipartFile png(String name) {
        byte[] body = new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00};
        return new MockMultipartFile("images", name, "image/png", body);
    }

    private static MockMultipartFile jpg(String name) {
        byte[] body = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00};
        return new MockMultipartFile("images", name, "image/jpeg", body);
    }

    @Nested
    @DisplayName("Function: uploadPostImages")
    class UploadPostImagesGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - files null or empty")
        void utcId01_shouldThrowInvalidInput_whenFilesEmpty() {
            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, null, user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());

            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(), user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - post missing")
        void utcId02_shouldThrowPostNotFound_whenPostMissing() {
            when(postRepository.findById(1L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(png("a.png")), user(1L)));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - not owner or user null")
        void utcId03_shouldThrowForbidden_whenNotOwnerOrUserNull() {
            CommunityPost p = post(1L, user(2L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));

            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(png("a.png")), null));
            assertEquals(ErrorCode.FORBIDDEN, ex1.getErrorCode());

            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(png("a.png")), user(1L)));
            assertEquals(ErrorCode.FORBIDDEN, ex2.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - exceeds max images per post")
        void utcId04_shouldThrowInvalidInput_whenExceedingLimit() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(9);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(png("a.png"), png("b.png")), user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
            assertEquals(Constants.MSG18, ex.getMessage());
        }

        @Test
        @DisplayName("UTCID05 [Negative] - invalid file type")
        void utcId05_shouldThrowInvalidFileType_whenValidationFails() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);

            MockMultipartFile badExt = new MockMultipartFile("images", "a.gif", "image/gif", new byte[] {1, 2, 3});
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(badExt), user(1L)));
            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID06 [Positive] - upload png and jpg success")
        void utcId06_shouldStoreAndSaveImages_whenValidFiles() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            when(userFileStorage.storeStream(any(), anyLong(), any(), any()))
                    .thenAnswer(inv -> "/uploads/" + inv.getArgument(3, String.class));

            service.uploadPostImages(1L, Arrays.asList(png("a.png"), null, jpg("b.jpg")), user(1L));

            ArgumentCaptor<CommunityPostImage> cap = ArgumentCaptor.forClass(CommunityPostImage.class);
            verify(imageRepository, times(2)).save(cap.capture());
            assertEquals(1, cap.getAllValues().get(0).getDisplayOrder());
            assertEquals(2, cap.getAllValues().get(1).getDisplayOrder());
            assertTrue(cap.getAllValues().get(0).getImageUrl().endsWith(".png"));
            assertTrue(cap.getAllValues().get(1).getImageUrl().endsWith(".jpg"));
        }
    }

    @Nested
    @DisplayName("Function: deletePostImage")
    class DeletePostImageGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - user null")
        void utcId01_shouldThrowUnauthorized_whenUserNull() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, null));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - post missing")
        void utcId02_shouldThrowPostNotFound_whenPostMissing() {
            when(postRepository.findById(1L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - not owner")
        void utcId03_shouldThrowForbidden_whenNotOwner() {
            when(postRepository.findById(1L)).thenReturn(Optional.of(post(1L, user(2L))));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Negative] - image missing or belongs to other post")
        void utcId04_shouldThrow_whenImageInvalid() {
            CommunityPost p1 = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p1));
            when(imageRepository.findById(2L)).thenReturn(Optional.empty());

            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());

            CommunityPost p2 = post(9L, user(1L));
            CommunityPostImage img = new CommunityPostImage();
            img.setId(2L);
            img.setPost(p2);
            img.setImageUrl("/uploads/community-posts/x.jpg");
            when(imageRepository.findById(2L)).thenReturn(Optional.of(img));

            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.FORBIDDEN, ex2.getErrorCode());
        }

        @Test
        @DisplayName("UTCID05 [Positive] - delete image success")
        void utcId05_shouldDeleteStorageAndRow_whenValid() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            CommunityPostImage img = new CommunityPostImage();
            img.setId(2L);
            img.setPost(p);
            img.setImageUrl("https://cdn/x.jpg");
            when(imageRepository.findById(2L)).thenReturn(Optional.of(img));

            service.deletePostImage(1L, 2L, user(1L));

            verify(userFileStorage).deleteStoredIfExists("https://cdn/x.jpg");
            verify(imageRepository).delete(img);
        }
    }
}