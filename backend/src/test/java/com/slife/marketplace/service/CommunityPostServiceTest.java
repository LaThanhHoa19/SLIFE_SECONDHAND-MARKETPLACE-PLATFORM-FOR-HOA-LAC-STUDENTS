package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommunityPostRequest;
import com.slife.marketplace.dto.request.UpdateCommunityPostRequest;
import com.slife.marketplace.dto.response.CommunityPostCardResponse;
import com.slife.marketplace.dto.response.CommunityPostResponse;
import com.slife.marketplace.dto.response.CursorPageResponse;
import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostImage;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Giới hạn số ảnh / bài")
    class MaxImages {

        @Test
        @DisplayName("clamp theo per-post + system cap")
        void clamp_shouldMin() {
            when(configService.getIntConfigValue("MAX_IMAGES_PER_POST", 10)).thenReturn(20);
            when(configService.getIntConfigValue("MAX_IMAGES", 20)).thenReturn(5);
            assertEquals(5, service.getMaxImagesPerPost());
        }

        @Test
        @DisplayName("config <=0 → clamp >=1")
        void clamp_negative_shouldBecomeAtLeast1() {
            when(configService.getIntConfigValue("MAX_IMAGES_PER_POST", 10)).thenReturn(-1);
            when(configService.getIntConfigValue("MAX_IMAGES", 1)).thenReturn(0);
            assertEquals(1, service.getMaxImagesPerPost());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Tạo bài kèm ảnh")
    class Create {

        @Test
        @DisplayName("[Lỗi] author null → UNAUTHORIZED")
        void authorNull_shouldThrow() {
            CreateCommunityPostRequest req = new CreateCommunityPostRequest();
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> service.createPostWithImages(null, req, List.of()));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] vượt quá max ảnh (lọc empty) → INVALID_INPUT MSG18")
        void exceedMax_shouldThrow() {
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
        @DisplayName("[Thường] luồng thành công: trim description + sync hashtag từ description+payload + upload images + trả detail")
        void happyPath_shouldSaveSyncUploadAndBuildDetail() {
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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Cập nhật bài viết")
    class Update {

        @Test
        @DisplayName("[Lỗi] author null → UNAUTHORIZED")
        void authorNull_shouldThrow() {
            UpdateCommunityPostRequest req = new UpdateCommunityPostRequest();
            SlifeException ex = assertThrows(SlifeException.class, () -> service.updatePost(1L, null, req));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] không phải owner → FORBIDDEN")
        void notOwner_shouldThrow() {
            CommunityPost p = post(1L, user(2L, "USER"));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            UpdateCommunityPostRequest req = new UpdateCommunityPostRequest();
            SlifeException ex = assertThrows(SlifeException.class, () -> service.updatePost(1L, user(1L, "USER"), req));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("description null → không đổi; hashtags null → không sync")
        void blanks_shouldNotOverwrite() {
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
        @DisplayName("update description + hashtags → sync (normalize + create missing)")
        void update_shouldSyncHashtags() {
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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Xóa mềm bài viết")
    class Delete {

        @Test
        @DisplayName("owner → mark deletedAt + status=DELETED")
        void softDelete_shouldMark() {
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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Feed bài viết")
    class Feed {

        @Test
        @DisplayName("latest no hashtag: clamp page/size + map card + likedByViewer")
        void latest_noHashtag_shouldMap() {
            User viewer = user(9L, "USER");
            CommunityPost p = post(1L, user(2L, "USER"));
            Page<CommunityPost> page = new PageImpl<>(List.of(p), PageRequest.of(0, 20), 1);
            when(postRepository.findVisibleForViewer(eq(CommunityPost.STATUS_ACTIVE), eq(viewer.getId()), any()))
                    .thenReturn(page);

            CommunityPostImage img = new CommunityPostImage();
            img.setId(5L);
            img.setPost(p);
            img.setImageUrl("/uploads/community-posts/x.png");
            when(imageRepository.findByPost_IdInOrderByPost_IdAscDisplayOrderAsc(List.of(1L))).thenReturn(List.of(img));
            when(likeRepository.countLikesByPostIds(List.of(1L))).thenReturn(List.<Object[]>of(new Object[]{1L, 7L}));
            when(commentRepository.countCommentsByPostIds(List.of(1L))).thenReturn(List.<Object[]>of(new Object[]{1L, 3L}));
            when(likeRepository.findPostIdsLikedByUser(viewer.getId(), List.of(1L))).thenReturn(List.of(1L));
            when(savedCommunityPostRepository.findSavedPostIdsByUserAndPostIds(viewer.getId(), List.of(1L)))
                    .thenReturn(List.of());

            var out = service.getFeed(-1, 999, null, "latest", viewer);
            assertEquals(1, out.getContent().size());
            CommunityPostCardResponse card = out.getContent().get(0);
            assertEquals(1L, card.getId());
            assertEquals("/uploads/community-posts/x.png", card.getThumbUrl());
            assertEquals(7L, card.getLikeCount());
            assertEquals(3L, card.getCommentCount());
            assertEquals(Boolean.TRUE, card.getIsLiked());
        }

        @Test
        @DisplayName("top + hashtag filter: gọi đúng repo method")
        void top_withHashtag_shouldUseHashtagTopQuery() {
            Page<CommunityPost> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
            when(postRepository.findVisibleForViewerByHashtagTop(eq(CommunityPost.STATUS_ACTIVE), eq("tag"), any(), any()))
                    .thenReturn(page);

            var out = service.getFeed(0, 20, "#TAG", "top", null);
            assertTrue(out.getContent().isEmpty());
            verify(postRepository).findVisibleForViewerByHashtagTop(eq(CommunityPost.STATUS_ACTIVE), eq("tag"), isNull(), any());
            verify(postRepository, never()).findVisibleForViewer(any(), any(), any());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Feed bài (cursor)")
    class FeedCursor {

        @Test
        @DisplayName("latest cursor: hasMore → nextCursor encodes last createdAt/id")
        void latest_shouldBuildNextCursor() {
            User viewer = user(9L, "USER");
            CommunityPost p1 = post(2L, user(2L, "USER"));
            p1.setCreatedAt(Instant.parse("2026-01-02T00:00:00Z"));
            CommunityPost p2 = post(1L, user(3L, "USER"));
            p2.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
            when(postRepository.findVisibleForViewerCursorLatest(eq(CommunityPost.STATUS_ACTIVE), eq(viewer.getId()),
                    any(), any(), any()))
                    .thenReturn(List.of(p1, p2)); // size==limit => hasMore

            when(imageRepository.findByPost_IdInOrderByPost_IdAscDisplayOrderAsc(List.of(2L, 1L))).thenReturn(List.of());
            when(likeRepository.countLikesByPostIds(List.of(2L, 1L))).thenReturn(List.of());
            when(commentRepository.countCommentsByPostIds(List.of(2L, 1L))).thenReturn(List.of());
            when(likeRepository.findPostIdsLikedByUser(eq(viewer.getId()), any())).thenReturn(List.of());
            when(savedCommunityPostRepository.findSavedPostIdsByUserAndPostIds(eq(viewer.getId()), any()))
                    .thenReturn(List.of());

            CursorPageResponse<CommunityPostCardResponse> out = service.getFeedCursor(2, null, null, "latest", viewer);
            assertTrue(out.isHasMore());
            assertNotNull(out.getNextCursor());
            CommunityPostCursorCodec.LatestCursor c = CommunityPostCursorCodec.decodeLatest(out.getNextCursor());
            assertNotNull(c);
            assertEquals(p2.getCreatedAt(), c.createdAt());
            assertEquals(p2.getId(), c.id());
        }

        @Test
        @DisplayName("top cursor: hasMore → nextCursor encodes score + last createdAt/id")
        void top_shouldBuildNextCursorWithScore() {
            CommunityPost p1 = post(2L, user(2L, "USER"));
            CommunityPost p2 = post(1L, user(3L, "USER"));
            p2.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));

            when(postRepository.findVisibleForViewerCursorTop(eq(CommunityPost.STATUS_ACTIVE), isNull(),
                    any(), any(), any(), any()))
                    .thenReturn(List.of(p1, p2));

            when(imageRepository.findByPost_IdInOrderByPost_IdAscDisplayOrderAsc(List.of(2L, 1L))).thenReturn(List.of());
            when(likeRepository.countLikesByPostIds(List.of(2L, 1L))).thenReturn(List.<Object[]>of(
                    new Object[]{1L, 7L}, new Object[]{2L, 1L}));
            when(commentRepository.countCommentsByPostIds(List.of(2L, 1L))).thenReturn(List.<Object[]>of(
                    new Object[]{1L, 3L}, new Object[]{2L, 0L}));

            CursorPageResponse<CommunityPostCardResponse> out = service.getFeedCursor(2, null, null, "top", null);
            CommunityPostCursorCodec.TopCursor c = CommunityPostCursorCodec.decodeTop(out.getNextCursor());
            assertNotNull(c);
            assertEquals(10L, c.score()); // p2 score = 7 likes + 3 comments
            assertEquals(p2.getCreatedAt(), c.createdAt());
            assertEquals(p2.getId(), c.id());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Nhóm: Chi tiết bài theo id")
    class GetById {

        @Test
        @DisplayName("[Lỗi] deleted → COMMUNITY_POST_NOT_FOUND")
        void deleted_shouldThrow() {
            CommunityPost p = post(1L, user(2L, "USER"));
            p.setDeletedAt(Instant.now());
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getById(1L, user(9L, "USER")));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
            verify(postRepository, never()).incrementViewCount(anyLong());
        }

        @Test
        @DisplayName("[Lỗi] hidden và viewer không phải owner/admin → COMMUNITY_POST_NOT_FOUND")
        void hidden_notOwnerNotAdmin_shouldThrow() {
            CommunityPost p = post(1L, user(2L, "USER"));
            p.setHiddenAt(Instant.now());
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getById(1L, user(9L, "USER")));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
            verify(postRepository, never()).incrementViewCount(anyLong());
        }

        @Test
        @DisplayName("[Lỗi] blocked → COMMUNITY_POST_NOT_FOUND")
        void blocked_shouldThrow() {
            User viewer = user(9L, "USER");
            CommunityPost p = post(1L, user(2L, "USER"));
            when(postRepository.findById(1L)).thenReturn(Optional.of(p));
            when(blockService.isBlockedByCurrentUser(2L, 9L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getById(1L, viewer));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
            verify(postRepository, never()).incrementViewCount(anyLong());
        }

        @Test
        @DisplayName("owner hoặc admin hoặc visible → incrementViewCount")
        void allowed_shouldIncrement() {
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

