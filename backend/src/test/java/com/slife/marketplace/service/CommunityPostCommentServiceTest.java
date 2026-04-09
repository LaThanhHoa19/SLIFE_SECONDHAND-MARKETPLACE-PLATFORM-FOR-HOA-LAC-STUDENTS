package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommunityPostCommentRequest;
import com.slife.marketplace.dto.request.ReplyCommunityPostCommentRequest;
import com.slife.marketplace.dto.request.UpdateCommunityPostCommentRequest;
import com.slife.marketplace.dto.response.CommentResponse;
import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostComment;
import com.slife.marketplace.entity.CommunityPostCommentImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostCommentImageRepository;
import com.slife.marketplace.repository.CommunityPostCommentRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import com.slife.marketplace.security.CommentRateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityPostCommentServiceTest {

    @Mock private CommunityPostCommentRepository commentRepository;
    @Mock private CommunityPostCommentImageRepository imageRepository;
    @Mock private CommunityPostRepository postRepository;
    @Mock private UserService userService;
    @Mock private CommentRateLimitService commentRateLimitService;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;
    @Mock private CommunityPostStatsBroadcastService statsBroadcastService;

    private CommunityPostCommentService service;

    @BeforeEach
    void setUp() {
        service = new CommunityPostCommentService(
                commentRepository,
                imageRepository,
                postRepository,
                userService,
                commentRateLimitService,
                auditLogService,
                notificationService,
                statsBroadcastService
        );
    }

    private static User user(long id, String role, String status) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setStatus(status);
        u.setEmail("u" + id + "@ex.com");
        u.setFullName("U" + id);
        return u;
    }

    private static User user(long id) {
        return user(id, "USER", "ACTIVE");
    }

    private static CommunityPost post(long id, User author, String status) {
        CommunityPost p = new CommunityPost();
        p.setId(id);
        p.setAuthor(author);
        p.setStatus(status);
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        return p;
    }

    private static CommunityPostComment comment(long id, CommunityPost post, User author, CommunityPostComment parent) {
        CommunityPostComment c = new CommunityPostComment();
        c.setId(id);
        c.setPost(post);
        c.setUser(author);
        c.setParentComment(parent);
        c.setContent("c" + id);
        c.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        return c;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("createComment")
    class CreateComment {

        @Test
        @DisplayName("User BANNED/RESTRICTED -> USER_BANNED_OR_RESTRICTED")
        void bannedRestricted_shouldThrow() {
            User u = user(1L);
            u.setStatus("BANNED");
            when(userService.getCurrentUser()).thenReturn(u);
            CreateCommunityPostCommentRequest req = new CreateCommunityPostCommentRequest();
            req.setContent("hi");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.createComment(10L, req));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex.getErrorCode());
            verifyNoInteractions(commentRateLimitService);
        }

        @Test
        @DisplayName("Rate limit -> RATE_LIMIT_EXCEEDED")
        void rateLimit_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            doThrow(new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED, "slow"))
                    .when(commentRateLimitService).assertAllowed(1L);
            CreateCommunityPostCommentRequest req = new CreateCommunityPostCommentRequest();
            req.setContent("hi");
            assertThrows(SlifeException.class, () -> service.createComment(10L, req));
            verify(commentRateLimitService, never()).recordSuccess(anyLong());
        }

        @Test
        @DisplayName("Không text và không ảnh -> INVALID_INPUT")
        void empty_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            CreateCommunityPostCommentRequest req = new CreateCommunityPostCommentRequest();
            req.setContent("  ");
            req.setImageUrls(new ArrayList<>());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.createComment(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Post không tồn tại -> COMMUNITY_POST_NOT_FOUND")
        void postMissing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(postRepository.findById(10L)).thenReturn(Optional.empty());
            CreateCommunityPostCommentRequest req = new CreateCommunityPostCommentRequest();
            req.setContent("x");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.createComment(10L, req));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Post bị hidden/deleted hoặc status != ACTIVE -> COMMUNITY_POST_NOT_FOUND")
        void postNotActive_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            CommunityPost p = post(10L, user(2L), "HIDDEN");
            when(postRepository.findById(10L)).thenReturn(Optional.of(p));
            CreateCommunityPostCommentRequest req = new CreateCommunityPostCommentRequest();
            req.setContent("x");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.createComment(10L, req));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: save comment + notify postAuthor (nếu khác) + recordSuccess + broadcast")
        void happyPath_shouldNotifyAndBroadcast() {
            User author = user(2L);
            CommunityPost p = post(10L, author, CommunityPost.STATUS_ACTIVE);
            User commenter = user(1L);
            when(userService.getCurrentUser()).thenReturn(commenter);
            when(postRepository.findById(10L)).thenReturn(Optional.of(p));
            when(commentRepository.save(any(CommunityPostComment.class))).thenAnswer(inv -> {
                CommunityPostComment c = inv.getArgument(0);
                c.setId(100L);
                return c;
            });

            CreateCommunityPostCommentRequest req = new CreateCommunityPostCommentRequest();
            req.setContent(" hi ");
            CommentResponse out = service.createComment(10L, req);

            assertEquals(100L, out.getId());
            verify(notificationService).notifyCommunityPostCommented(author, commenter, 10L);
            verify(commentRateLimitService).recordSuccess(1L);
            verify(statsBroadcastService).broadcastStats(10L);
        }

        @Test
        @DisplayName("PostAuthor tự comment -> không notifyCommunityPostCommented")
        void authorSelfComment_shouldNotNotify() {
            User author = user(2L);
            CommunityPost p = post(10L, author, CommunityPost.STATUS_ACTIVE);
            when(userService.getCurrentUser()).thenReturn(author);
            when(postRepository.findById(10L)).thenReturn(Optional.of(p));
            when(commentRepository.save(any())).thenAnswer(inv -> {
                CommunityPostComment c = inv.getArgument(0);
                c.setId(101L);
                return c;
            });
            CreateCommunityPostCommentRequest req = new CreateCommunityPostCommentRequest();
            req.setContent("x");
            service.createComment(10L, req);
            verify(notificationService, never()).notifyCommunityPostCommented(any(), any(), anyLong());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("replyToComment")
    class ReplyToComment {

        @Test
        @DisplayName("Parent không tồn tại -> COMMUNITY_POST_COMMENT_NOT_FOUND")
        void parentMissing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(commentRepository.findById(5L)).thenReturn(Optional.empty());
            ReplyCommunityPostCommentRequest req = new ReplyCommunityPostCommentRequest();
            req.setContent("r");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.replyToComment(5L, req));
            assertEquals(ErrorCode.COMMUNITY_POST_COMMENT_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Post null hoặc deleted -> COMMUNITY_POST_NOT_FOUND")
        void postNullOrDeleted_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            CommunityPostComment parent = new CommunityPostComment();
            parent.setId(5L);
            parent.setPost(null);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            ReplyCommunityPostCommentRequest req = new ReplyCommunityPostCommentRequest();
            req.setContent("r");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.replyToComment(5L, req));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không phải chủ post và cũng không phải tác giả parent -> FORBIDDEN")
        void stranger_shouldThrow() {
            User postAuthor = user(2L);
            CommunityPost p = post(10L, postAuthor, CommunityPost.STATUS_ACTIVE);
            User parentAuthor = user(3L);
            CommunityPostComment parent = comment(5L, p, parentAuthor, null);
            when(userService.getCurrentUser()).thenReturn(user(9L));
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            ReplyCommunityPostCommentRequest req = new ReplyCommunityPostCommentRequest();
            req.setContent("r");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.replyToComment(5L, req));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: postAuthor reply -> notify parentAuthor; không notify discussionJoined cho chính mình")
        void postAuthorReply_shouldNotify() {
            User postAuthor = user(2L);
            CommunityPost p = post(10L, postAuthor, CommunityPost.STATUS_ACTIVE);
            User parentAuthor = user(3L);
            CommunityPostComment parent = comment(5L, p, parentAuthor, null);
            when(userService.getCurrentUser()).thenReturn(postAuthor);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(commentRepository.save(any())).thenAnswer(inv -> {
                CommunityPostComment c = inv.getArgument(0);
                c.setId(50L);
                return c;
            });
            ReplyCommunityPostCommentRequest req = new ReplyCommunityPostCommentRequest();
            req.setContent("r");
            service.replyToComment(5L, req);
            verify(notificationService).notifyCommunityCommentReply(parentAuthor, postAuthor, 10L);
            verify(notificationService, never()).notifyCommunityDiscussionJoined(any(), any(), anyLong());
            verify(statsBroadcastService).broadcastStats(10L);
        }

        @Test
        @DisplayName("ParentAuthor reply chính mình -> không notify reply cho chính mình")
        void parentAuthorSelfReply_shouldNotNotifySelf() {
            User postAuthor = user(2L);
            CommunityPost p = post(10L, postAuthor, CommunityPost.STATUS_ACTIVE);
            User parentAuthor = user(3L);
            CommunityPostComment parent = comment(5L, p, parentAuthor, null);
            when(userService.getCurrentUser()).thenReturn(parentAuthor);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(commentRepository.save(any())).thenAnswer(inv -> {
                CommunityPostComment c = inv.getArgument(0);
                c.setId(51L);
                return c;
            });
            ReplyCommunityPostCommentRequest req = new ReplyCommunityPostCommentRequest();
            req.setContent("r");
            service.replyToComment(5L, req);
            verify(notificationService, never()).notifyCommunityCommentReply(any(), any(), anyLong());
        }

        @Test
        @DisplayName("PostAuthor = parentAuthor -> không notify reply/self và không notify discussionJoined")
        void postAuthorEqualsParentAuthor_shouldNotDuplicateDiscussion() {
            User author = user(2L);
            CommunityPost p = post(10L, author, CommunityPost.STATUS_ACTIVE);
            CommunityPostComment parent = comment(5L, p, author, null);
            // Only post author (or parent author) can reply; here post author replies their own comment
            when(userService.getCurrentUser()).thenReturn(author);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(commentRepository.save(any())).thenAnswer(inv -> {
                CommunityPostComment c = inv.getArgument(0);
                c.setId(52L);
                return c;
            });
            ReplyCommunityPostCommentRequest req = new ReplyCommunityPostCommentRequest();
            req.setContent("r");
            service.replyToComment(5L, req);
            verify(notificationService, never()).notifyCommunityCommentReply(any(), any(), anyLong());
            verify(notificationService, never()).notifyCommunityDiscussionJoined(any(), any(), anyLong());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("deleteComment")
    class DeleteComment {

        @Test
        @DisplayName("Không tồn tại -> COMMUNITY_POST_COMMENT_NOT_FOUND")
        void missing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(commentRepository.findById(9L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.deleteComment(9L));
            assertEquals(ErrorCode.COMMUNITY_POST_COMMENT_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không phải owner/admin/postAuthor -> COMMENT_DELETE_FORBIDDEN")
        void forbidden_shouldThrow() {
            User postAuthor = user(2L);
            CommunityPost p = post(10L, postAuthor, CommunityPost.STATUS_ACTIVE);
            CommunityPostComment c = comment(7L, p, user(3L), null);
            when(userService.getCurrentUser()).thenReturn(user(9L));
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            SlifeException ex = assertThrows(SlifeException.class, () -> service.deleteComment(7L));
            assertEquals(ErrorCode.COMMENT_DELETE_FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("ADMIN xóa -> audit log + delete images + delete comment + broadcast")
        void adminDelete_shouldAuditAndBroadcast() {
            User admin = user(99L, "ADMIN", "ACTIVE");
            CommunityPost p = post(10L, user(2L), CommunityPost.STATUS_ACTIVE);
            CommunityPostComment c = comment(7L, p, user(3L), null);
            when(userService.getCurrentUser()).thenReturn(admin);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));

            service.deleteComment(7L);

            verify(auditLogService).logAdminCommentDelete(admin, 7L, 10L);
            verify(imageRepository).deleteAllByComment_Id(7L);
            verify(commentRepository).delete(c);
            verify(statsBroadcastService).broadcastStats(10L);
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("updateComment")
    class UpdateComment {

        @Test
        @DisplayName("Không tồn tại -> COMMUNITY_POST_COMMENT_NOT_FOUND")
        void missing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(commentRepository.findById(9L)).thenReturn(Optional.empty());
            UpdateCommunityPostCommentRequest req = new UpdateCommunityPostCommentRequest();
            req.setContent("x");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.updateComment(9L, req));
            assertEquals(ErrorCode.COMMUNITY_POST_COMMENT_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không phải owner -> FORBIDDEN")
        void notOwner_shouldThrow() {
            User owner = user(2L);
            CommunityPost p = post(10L, user(1L), CommunityPost.STATUS_ACTIVE);
            CommunityPostComment c = comment(7L, p, owner, null);
            when(userService.getCurrentUser()).thenReturn(user(9L));
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            UpdateCommunityPostCommentRequest req = new UpdateCommunityPostCommentRequest();
            req.setContent("x");
            SlifeException ex = assertThrows(SlifeException.class, () -> service.updateComment(7L, req));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: imageUrls != null -> xóa ảnh cũ, lưu ảnh mới")
        void updateWithImages_shouldReplace() {
            User owner = user(2L);
            CommunityPost p = post(10L, user(1L), CommunityPost.STATUS_ACTIVE);
            CommunityPostComment c = comment(7L, p, owner, null);
            when(userService.getCurrentUser()).thenReturn(owner);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            when(commentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(imageRepository.findByComment_Id(7L)).thenReturn(List.of());

            UpdateCommunityPostCommentRequest req = new UpdateCommunityPostCommentRequest();
            req.setContent("new");
            req.setImageUrls(List.of("u1"));
            CommentResponse out = service.updateComment(7L, req);

            assertEquals(7L, out.getId());
            verify(imageRepository).deleteAllByComment_Id(7L);
            verify(imageRepository).save(any(CommunityPostCommentImage.class));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("getCommentsForPost")
    class GetCommentsForPost {

        @Test
        @DisplayName("Post không tồn tại -> COMMUNITY_POST_NOT_FOUND")
        void postMissing_shouldThrow() {
            when(postRepository.findById(10L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> service.getCommentsForPost(10L));
            assertEquals(ErrorCode.COMMUNITY_POST_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không có comment -> list rỗng")
        void noComments_shouldReturnEmpty() {
            when(postRepository.findById(10L)).thenReturn(Optional.of(post(10L, user(1L), CommunityPost.STATUS_ACTIVE)));
            when(commentRepository.findByPost_IdOrderByCreatedAtAsc(10L)).thenReturn(List.of());
            assertTrue(service.getCommentsForPost(10L).isEmpty());
        }

        @Test
        @DisplayName("Cây comment + ảnh; bỏ comment deletedAt != null")
        void treeAndImages_shouldMapAndFilterDeleted() {
            CommunityPost p = post(10L, user(1L), CommunityPost.STATUS_ACTIVE);
            CommunityPostComment root = comment(100L, p, user(2L), null);
            CommunityPostComment reply = comment(101L, p, user(1L), root);
            CommunityPostComment deleted = comment(999L, p, user(3L), null);
            deleted.setDeletedAt(Instant.now());
            when(postRepository.findById(10L)).thenReturn(Optional.of(p));
            when(commentRepository.findByPost_IdOrderByCreatedAtAsc(10L)).thenReturn(List.of(root, reply, deleted));
            CommunityPostCommentImage img = new CommunityPostCommentImage();
            img.setImageUrl("u");
            when(imageRepository.findByComment_Id(100L)).thenReturn(List.of(img));
            when(imageRepository.findByComment_Id(101L)).thenReturn(List.of());

            List<CommentResponse> out = service.getCommentsForPost(10L);

            assertEquals(1, out.size());
            assertEquals(100L, out.get(0).getId());
            assertEquals(List.of("u"), out.get(0).getImages());
            assertEquals(1, out.get(0).getReplies().size());
            assertEquals(101L, out.get(0).getReplies().get(0).getId());
        }
    }
}

