package com.slife.marketplace.service;

import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostImageRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import com.slife.marketplace.storage.FileStorage;
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

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityPostImageServiceTest {

    @Mock private CommunityPostRepository postRepository;
    @Mock private CommunityPostImageRepository imageRepository;
    @Mock private ConfigService configService;
    @Mock private FileStorage fileStorage;

    private CommunityPostImageService service;

    @BeforeEach
    void setUp() {
        service = new CommunityPostImageService(
                postRepository,
                imageRepository,
                configService,
                fileStorage,
                Path.of("uploads").toAbsolutePath().normalize()
        );
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
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
        byte[] body = new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00};
        return new MockMultipartFile("images", name, "image/png", body);
    }

    private static MockMultipartFile jpg(String name) {
        byte[] body = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01};
        return new MockMultipartFile("images", name, "image/jpeg", body);
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("uploadPostImages")
    class Upload {

        @Test
        @DisplayName("files null/empty -> INVALID_INPUT")
        void emptyFiles_shouldThrow() {
            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, null, user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());
            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(), user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
        }

        @Test
        @DisplayName("post không tồn tại -> COMMUNITY_POST_NOT_FOUND")
        void postMissing_shouldThrow() {
            when(postRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(png("a.png")), user(1L)));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("không phải chủ post hoặc currentUser null -> FORBIDDEN")
        void notOwner_shouldThrow() {
            CommunityPost p = post(1L, user(2L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            assertEquals(ErrorCode.FORBIDDEN,
                    assertThrows(SlifeException.class, () -> service.uploadPostImages(1L, List.of(png("a.png")), null)).getErrorCode());
            assertEquals(ErrorCode.FORBIDDEN,
                    assertThrows(SlifeException.class, () -> service.uploadPostImages(1L, List.of(png("a.png")), user(1L))).getErrorCode());
        }

        @Test
        @DisplayName("vượt giới hạn ảnh -> INVALID_INPUT (MSG18)")
        void exceedMax_shouldThrow() {
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
        @DisplayName("file quá lớn -> FILE_TOO_LARGE")
        void tooLarge_shouldThrow() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            byte[] big = new byte[(int) (CommunityPostImageService.MAX_IMAGE_MB * 1024L * 1024L + 1L)];
            MockMultipartFile f = new MockMultipartFile("images", "a.png", "image/png", big);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(f), user(1L)));
            assertEquals(ErrorCode.FILE_TOO_LARGE, ex.getErrorCode());
        }

        @Test
        @DisplayName("sai filename extension -> INVALID_FILE_TYPE")
        void invalidExt_shouldThrow() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            MockMultipartFile f = new MockMultipartFile("images", "a.gif", "image/gif", new byte[]{1,2,3});
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(f), user(1L)));
            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
        }

        @Test
        @DisplayName("sai content-type -> INVALID_FILE_TYPE")
        void invalidContentType_shouldThrow() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            MockMultipartFile f = new MockMultipartFile("images", "a.png", "application/octet-stream", new byte[]{1,2,3});
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(f), user(1L)));
            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
        }

        @Test
        @DisplayName("magic bytes không phải JPG/PNG -> INVALID_FILE_TYPE")
        void invalidMagic_shouldThrow() {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            MockMultipartFile f = new MockMultipartFile("images", "a.png", "image/png", new byte[]{0x00,0x01,0x02});
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(f), user(1L)));
            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
        }

        @Test
        @DisplayName("IO exception -> FILE_UPLOAD_FAILED")
        void ioFailure_shouldThrow() throws Exception {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            doThrow(new IOException("disk")).when(fileStorage).createDirectories(any(Path.class));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.uploadPostImages(1L, List.of(png("a.png")), user(1L)));
            assertEquals(ErrorCode.FILE_UPLOAD_FAILED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: save image + gọi FileStorage.copy + url chuẩn")
        void happyPath_shouldSave() throws Exception {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(imageRepository.countByPost_Id(1L)).thenReturn(0);
            when(configService.getIntConfigValue(eq("MAX_IMAGES_PER_POST"), anyInt())).thenReturn(10);
            when(configService.getIntConfigValue(eq("MAX_IMAGES"), anyInt())).thenReturn(10);
            // service checks target.startsWith(dir.toAbsolutePath().normalize()).
            // If uploadBasePath is relative in tests, ensure it behaves as expected.
            doAnswer(inv -> null).when(fileStorage).createDirectories(any(Path.class));
            doAnswer(inv -> null).when(fileStorage).copy(any(InputStream.class), any(Path.class));

            service.uploadPostImages(1L, List.of(png("a.png"), jpg("b.jpg")), user(1L));

            verify(fileStorage, atLeastOnce()).createDirectories(any(Path.class));
            verify(fileStorage, times(2)).copy(any(InputStream.class), any(Path.class));
            ArgumentCaptor<CommunityPostImage> cap = ArgumentCaptor.forClass(CommunityPostImage.class);
            verify(imageRepository, times(2)).save(cap.capture());
            assertTrue(cap.getAllValues().get(0).getImageUrl().startsWith("/uploads/community-posts/"));
            assertEquals(1, cap.getAllValues().get(0).getDisplayOrder());
            assertEquals(2, cap.getAllValues().get(1).getDisplayOrder());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("deletePostImage")
    class Delete {

        @Test
        @DisplayName("currentUser null -> UNAUTHORIZED")
        void userNull_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, null));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("post không tồn tại -> COMMUNITY_POST_NOT_FOUND")
        void postMissing_shouldThrow() {
            when(postRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("không phải chủ post -> FORBIDDEN")
        void notOwner_shouldThrow() {
            when(postRepository.findById(1L)).thenReturn(Optional.of(post(1L, user(2L))));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("image không tồn tại -> INVALID_INPUT")
        void imageMissing_shouldThrow() {
            when(postRepository.findById(1L)).thenReturn(Optional.of(post(1L, user(1L))));
            when(imageRepository.findById(2L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("image không thuộc post -> FORBIDDEN")
        void wrongPost_shouldThrow() {
            CommunityPost p1 = post(1L, user(1L));
            CommunityPost p2 = post(9L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p1));
            CommunityPostImage img = new CommunityPostImage();
            img.setId(2L);
            img.setPost(p2);
            img.setImageUrl("/uploads/community-posts/x.jpg");
            when(imageRepository.findById(2L)).thenReturn(Optional.of(img));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.deletePostImage(1L, 2L, user(1L)));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("url không bắt đầu /uploads/ -> không gọi deleteIfExists nhưng vẫn delete row")
        void nonUploadUrl_shouldSkipDeleteFile() throws Exception {
            CommunityPost p = post(1L, user(1L));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            CommunityPostImage img = new CommunityPostImage();
            img.setId(2L);
            img.setPost(p);
            img.setImageUrl("https://cdn/x.jpg");
            when(imageRepository.findById(2L)).thenReturn(Optional.of(img));

            service.deletePostImage(1L, 2L, user(1L));

            verify(fileStorage, never()).deleteIfExists(any(Path.class));
            verify(imageRepository).delete(img);
        }
    }
}

