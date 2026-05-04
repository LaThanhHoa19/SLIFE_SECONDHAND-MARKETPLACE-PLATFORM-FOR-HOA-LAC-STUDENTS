package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommunityPostRequest;
import com.slife.marketplace.dto.request.UpdateCommunityPostRequest;
import com.slife.marketplace.dto.response.CommunityPostResponse;
import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.Hashtag;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostCommentRepository;
import com.slife.marketplace.repository.CommunityPostImageRepository;
import com.slife.marketplace.repository.CommunityPostLikeRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import com.slife.marketplace.repository.HashtagRepository;
import com.slife.marketplace.repository.SavedCommunityPostRepository;
import com.slife.marketplace.util.Constants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityPostServiceTest {

    @Mock private CommunityPostRepository postRepository;
    @Mock private CommunityPostImageRepository imageRepository;
    @Mock private CommunityPostLikeRepository likeRepository;
    @Mock private CommunityPostCommentRepository commentRepository;
    @Mock private HashtagRepository hashtagRepository;
    @Mock private SavedCommunityPostRepository savedCommunityPostRepository;
    @Mock private CommunityPostImageService imageService;
    @Mock private BlockService blockService;
    @Mock private ConfigService configService;
    @Mock private ContentModerationService contentModerationService;
    @Mock private CommunityPostStatsBroadcastService communityPostStatsBroadcastService;

    private CommunityPostService service;

    @BeforeEach
    void setUp() {
        service = new CommunityPostService(
                postRepository,
                imageRepository,
                likeRepository,
                commentRepository,
                hashtagRepository,
                savedCommunityPostRepository,
                imageService,
                blockService,
                configService,
                contentModerationService,
                communityPostStatsBroadcastService
        );
    }

    private static User user(long id, String role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    private static CommunityPost post(long id, User author) {
        CommunityPost p = new CommunityPost();
        p.setId(id);
        p.setAuthor(author);
        p.setDescription("T");
        p.setStatus(CommunityPost.STATUS_ACTIVE);
        p.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        p.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        p.setViewCount(0L);
        return p;
    }

    private static MockMultipartFile img(String name, boolean empty) {
        byte[] body = empty ? new byte[0] : new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47};
        return new MockMultipartFile("images", name, "image/png", body);
    }

    @Nested
    @DisplayName("Function: getMaxImagesPerPost")
    class GetMaxImagesPerPostGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - lấy min giữa per-post và system cap")
        void utcId01_shouldReturnMinBetweenPerPostAndSystemCap() {
            when(configService.getIntConfigValue("MAX_IMAGES_PER_POST", 10)).thenReturn(20);
            when(configService.getIntConfigValue("MAX_IMAGES", 20)).thenReturn(5);
            assertEquals(5, service.getMaxImagesPerPost());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - config lỗi (<=0) vẫn chặn tối thiểu 1 ảnh")
        void utcId02_shouldClampToAtLeastOne_whenConfigsNonPositive() {
            when(configService.getIntConfigValue("MAX_IMAGES_PER_POST", 10)).thenReturn(-1);
            when(configService.getIntConfigValue("MAX_IMAGES", 1)).thenReturn(0);
            assertEquals(1, service.getMaxImagesPerPost());
        }
    }

    @Nested
    @DisplayName("Function: createPostWithImages")
    class CreatePostWithImagesGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - chưa đăng nhập vẫn tạo bài")
        void utcId01_shouldThrowUnauthorized_whenAuthorNull() {
            CreateCommunityPostRequest req = new CreateCommunityPostRequest();
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.createPostWithImages(null, req, List.of()));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - số ảnh hợp lệ vượt mức cấu hình")
        void utcId02_shouldThrowInvalidInput_whenImageCountExceedsLimit() {
            when(configService.getIntConfigValue("MAX_IMAGES_PER_POST", 10)).thenReturn(1);
            when(configService.getIntConfigValue("MAX_IMAGES", 1)).thenReturn(1);
            CreateCommunityPostRequest req = new CreateCommunityPostRequest();

            SlifeException ex = assertThrows(SlifeException.class, () -> service.createPostWithImages(
                    user(1L, "USER"),
                    req,
                    List.of(img("a.png", false), img("b.png", false), img("c.png", true)) // last is empty and ignored
            ));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
            assertEquals(Constants.MSG18, ex.getMessage());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - tạo thành công, đồng bộ hashtag và upload ảnh")
        void utcId03_shouldCreateSyncHashtagsUploadAndReturnDetail() {
            User author = user(1L, "USER");
            CreateCommunityPostRequest req = new CreateCommunityPostRequest();
            req.setDescription("desc #TagOne and #tag_two");
            req.setHashtags(List.of("#TAGTHREE", "bad tag", "#tag_two"));

            when(configService.getIntConfigValue("MAX_IMAGES_PER_POST", 10)).thenReturn(10);
            when(configService.getIntConfigValue("MAX_IMAGES", 10)).thenReturn(10);

            final CommunityPost[] savedRef = new CommunityPost[1];
            // save mới -> set id và giữ reference để buildDetailResponse thấy hashtags đã sync
            when(postRepository.save(any(CommunityPost.class))).thenAnswer(inv -> {
                CommunityPost p = inv.getArgument(0);
                if (p.getId() == null) p.setId(99L);
                savedRef[0] = p;
                return p;
            });

            // hashtag repo: existing tag_two, create others
            Hashtag tagTwo = new Hashtag();
            tagTwo.setId(2L);
            tagTwo.setTag("tag_two");
            when(hashtagRepository.findByTag("tag_two")).thenReturn(Optional.of(tagTwo));
            when(hashtagRepository.findByTag("tagone")).thenReturn(Optional.empty());
            when(hashtagRepository.findByTag("tagthree")).thenReturn(Optional.empty());
            when(hashtagRepository.save(any(Hashtag.class))).thenAnswer(inv -> {
                Hashtag h = inv.getArgument(0);
                h.setId(100L);
                return h;
            });

            // buildDetailResponse fetches these
            when(postRepository.findById(99L)).thenAnswer(inv -> Optional.ofNullable(savedRef[0]));
            when(imageRepository.findByPost_IdOrderByDisplayOrderAsc(99L)).thenReturn(List.of());
            when(likeRepository.countByPost_Id(99L)).thenReturn(0L);
            when(commentRepository.countByPost_IdAndDeletedAtIsNull(99L)).thenReturn(0L);
            when(likeRepository.existsByUser_IdAndPost_Id(author.getId(), 99L)).thenReturn(false);

            CommunityPostResponse out = service.createPostWithImages(
                    author, req, List.of(img("a.png", false), img("b.png", false)));

            assertEquals(99L, out.getId());
            assertEquals("desc #TagOne and #tag_two", out.getDescription());
            verify(imageService).uploadPostImages(eq(99L), anyList(), eq(author));

            // verify hashtags đã được normalize + unique (tagone, tag_two, tagthree)
            assertEquals(3, out.getHashtags().size());
            assertTrue(out.getHashtags().containsAll(List.of("tagone", "tag_two", "tagthree")));
        }
    }

    @Nested
    @DisplayName("Function: updatePost")
    class UpdatePostGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - chưa đăng nhập vẫn sửa bài")
        void utcId01_shouldThrowUnauthorized_whenAuthorNull() {
            UpdateCommunityPostRequest req = new UpdateCommunityPostRequest();
            SlifeException ex = assertThrows(SlifeException.class, () -> service.updatePost(1L, null, req));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - không phải chủ bài viết")
        void utcId02_shouldThrowForbidden_whenNotOwner() {
            CommunityPost p = post(1L, user(2L, "USER"));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            UpdateCommunityPostRequest req = new UpdateCommunityPostRequest();
            SlifeException ex = assertThrows(SlifeException.class, () -> service.updatePost(1L, user(1L, "USER"), req));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - không gửi field mới thì giữ nguyên dữ liệu cũ")
        void utcId03_shouldKeepOldFields_whenRequestFieldsNull() {
            User author = user(1L, "USER");
            CommunityPost p = post(1L, author);
            p.setDescription("KeepDesc");
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));

            UpdateCommunityPostRequest req = new UpdateCommunityPostRequest();
            req.setDescription(null);
            req.setHashtags(null);

            // buildDetailResponse
            when(imageRepository.findByPost_IdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
            when(likeRepository.countByPost_Id(1L)).thenReturn(0L);
            when(commentRepository.countByPost_IdAndDeletedAtIsNull(1L)).thenReturn(0L);
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(false);

            CommunityPostResponse out = service.updatePost(1L, author, req);
            assertEquals("KeepDesc", out.getDescription());
            verifyNoInteractions(hashtagRepository);
        }

        @Test
        @DisplayName("UTCID04 [Positive] - sửa mô tả và hashtag, hệ thống normalize + đồng bộ")
        void utcId04_shouldSyncHashtags_whenDescriptionOrTagsChanged() {
            User author = user(1L, "USER");
            CommunityPost p = post(1L, author);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));

            UpdateCommunityPostRequest req = new UpdateCommunityPostRequest();
            req.setDescription("new #A #B");
            req.setHashtags(List.of("#c"));

            when(hashtagRepository.findByTag("a")).thenReturn(Optional.empty());
            when(hashtagRepository.findByTag("b")).thenReturn(Optional.empty());
            when(hashtagRepository.findByTag("c")).thenReturn(Optional.empty());
            when(hashtagRepository.save(any(Hashtag.class))).thenAnswer(inv -> {
                Hashtag h = inv.getArgument(0);
                h.setId(10L);
                return h;
            });

            when(imageRepository.findByPost_IdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
            when(likeRepository.countByPost_Id(1L)).thenReturn(0L);
            when(commentRepository.countByPost_IdAndDeletedAtIsNull(1L)).thenReturn(0L);
            when(likeRepository.existsByUser_IdAndPost_Id(1L, 1L)).thenReturn(false);

            CommunityPostResponse out = service.updatePost(1L, author, req);
            assertTrue(out.getHashtags().containsAll(List.of("a", "b", "c")));
            verify(postRepository).save(p);
        }
    }

    @Nested
    @DisplayName("Function: softDeletePost")
    class SoftDeletePostGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - chủ bài xóa mềm thành công")
        void utcId01_shouldSoftDeleteAndBroadcast_whenOwnerDeletes() {
            User author = user(1L, "USER");
            CommunityPost p = post(1L, author);
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));

            service.softDeletePost(1L, author);

            assertNotNull(p.getDeletedAt());
            assertEquals(CommunityPost.STATUS_DELETED, p.getStatus());
            verify(postRepository).save(p);
            verify(communityPostStatsBroadcastService).broadcastPostDeleted(1L);
        }
    }

    @Nested
    @DisplayName("Function: getById")
    class GetByIdGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - bài đã xóa mềm")
        void utcId01_shouldThrowNotFound_whenDeleted() {
            CommunityPost p = post(1L, user(2L, "USER"));
            p.setDeletedAt(Instant.now());
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getById(1L, user(9L, "USER")));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
            verify(postRepository, never()).incrementViewCount(anyLong());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - bài bị ẩn, người xem không phải owner/admin")
        void utcId02_shouldThrowNotFound_whenHiddenAndViewerUnauthorized() {
            CommunityPost p = post(1L, user(2L, "USER"));
            p.setHiddenAt(Instant.now());
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getById(1L, user(9L, "USER")));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
            verify(postRepository, never()).incrementViewCount(anyLong());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - viewer đã chặn tác giả")
        void utcId03_shouldThrowNotFound_whenBlockedRelationship() {
            User viewer = user(9L, "USER");
            CommunityPost p = post(1L, user(2L, "USER"));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(blockService.isBlockedByCurrentUser(2L, 9L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getById(1L, viewer));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
            verify(postRepository, never()).incrementViewCount(anyLong());
        }

        @Test
        @DisplayName("UTCID04 [Positive] - owner mở bài ẩn vẫn xem được và tăng view")
        void utcId04_shouldIncrementView_whenOwnerAllowed() {
            User owner = user(2L, "USER");
            CommunityPost p = post(1L, owner);
            p.setHiddenAt(Instant.now()); // hidden but owner => allowed
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(blockService.isBlockedByCurrentUser(anyLong(), anyLong())).thenReturn(false);
            when(imageRepository.findByPost_IdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
            when(likeRepository.countByPost_Id(1L)).thenReturn(0L);
            when(commentRepository.countByPost_IdAndDeletedAtIsNull(1L)).thenReturn(0L);
            when(likeRepository.existsByUser_IdAndPost_Id(owner.getId(), 1L)).thenReturn(false);

            CommunityPostResponse out = service.getById(1L, owner);
            assertEquals(1L, out.getId());
            verify(postRepository).incrementViewCount(1L);
        }
    }
}

