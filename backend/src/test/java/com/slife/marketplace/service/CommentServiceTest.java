package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommentRequest;
import com.slife.marketplace.dto.request.ReplyCommentRequest;
import com.slife.marketplace.dto.request.UpdateCommentRequest;
import com.slife.marketplace.dto.response.CommentResponse;
import com.slife.marketplace.entity.Comment;
import com.slife.marketplace.entity.CommentImage;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommentImageRepository;
import com.slife.marketplace.repository.CommentRepository;
import com.slife.marketplace.repository.ListingRepository;
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
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private CommentImageRepository commentImageRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private UserService userService;
    @Mock private BlockService blockService;
    @Mock private NotificationService notificationService;
    @Mock private AuditLogService auditLogService;
    @Mock private CommentRateLimitService commentRateLimitService;
    @Mock private ContentModerationService contentModerationService;

    private CommentService commentService;

    @BeforeEach
    void setUp() {
        commentService = new CommentService(
                commentRepository,
                commentImageRepository,
                listingRepository,
                userService,
                blockService,
                notificationService,
                auditLogService,
                commentRateLimitService,
                contentModerationService
        );
    }

    private static User user(long id, String role, String status) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@example.com");
        u.setFullName("U" + id);
        u.setRole(role);
        u.setStatus(status);
        return u;
    }

    private static User user(long id) {
        return user(id, "USER", "ACTIVE");
    }

    private static Listing listing(long id, User seller) {
        Listing l = new Listing();
        l.setId(id);
        l.setSeller(seller);
        l.setTitle("L" + id);
        return l;
    }

    private static Comment comment(long id, User author, Listing listing, Comment parent) {
        Comment c = new Comment();
        c.setId(id);
        c.setUser(author);
        c.setListing(listing);
        c.setParentComment(parent);
        c.setContent("c" + id);
        c.setCreatedAt(Instant.parse("2024-01-01T00:00:00Z"));
        return c;
    }

    // -------------------------------------------------------------------------
    // createComment
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Tạo bình luận (createComment)")
    class CreateComment {

        @Test
        @DisplayName("[Lỗi] User RESTRICTED → USER_BANNED_OR_RESTRICTED")
        void restricted_shouldThrow() {
            User u = user(1L);
            u.setStatus("RESTRICTED");
            when(userService.getCurrentUser()).thenReturn(u);
            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent("hi");
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.createComment(req));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] User BANNED → USER_BANNED_OR_RESTRICTED")
        void banned_shouldThrow() {
            User u = user(1L);
            u.setStatus("BANNED");
            when(userService.getCurrentUser()).thenReturn(u);
            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent("hi");
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.createComment(req));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex.getErrorCode());
            verifyNoInteractions(commentRateLimitService);
        }

        @Test
        @DisplayName("[Lỗi] Vượt rate limit → RATE_LIMIT_EXCEEDED")
        void rateLimit_shouldThrow() {
            User u = user(1L);
            when(userService.getCurrentUser()).thenReturn(u);
            doThrow(new SlifeException(ErrorCode.RATE_LIMIT_EXCEEDED, "slow"))
                    .when(commentRateLimitService).assertAllowed(1L);
            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent("x");
            assertThrows(SlifeException.class, () -> commentService.createComment(req));
            verify(commentRateLimitService, never()).recordSuccess(any());
        }

        @Test
        @DisplayName("[Lỗi] Không text và không ảnh → INVALID_INPUT")
        void noContentNoImage_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent("   ");
            req.setImageUrls(new ArrayList<>());
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.createComment(req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Listing không tồn tại → LISTING_NOT_FOUND")
        void listingMissing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(listingRepository.findById(99L)).thenReturn(Optional.empty());
            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(99L);
            req.setContent("ok");
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.createComment(req));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Người mua bị chặn với seller → LISTING_NOT_FOUND")
        void blockedWithSeller_shouldThrow() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent("hi");
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.createComment(req));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: người khác seller → lưu comment + notify seller + recordSuccess")
        void happyPath_shouldNotifySeller() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(100L);
                return c;
            });

            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent(" Xin chào ");

            CommentResponse res = commentService.createComment(req);

            assertEquals(100L, res.getId());
            assertEquals("Xin chào", res.getContent());
            verify(notificationService).notifyListingCommented(seller, buyer, 10L);
            verify(commentRateLimitService).recordSuccess(1L);
            verify(commentImageRepository, never()).save(any());
        }

        @Test
        @DisplayName("Seller tự bình luận → không gửi notify listing commented")
        void sellerSelfComment_shouldNotNotifyListingCommented() {
            User seller = user(2L);
            Listing l = listing(10L, seller);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(101L);
                return c;
            });

            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent("note");

            commentService.createComment(req);

            verify(notificationService, never()).notifyListingCommented(any(), any(), anyLong());
            verify(commentRateLimitService).recordSuccess(2L);
        }

        @Test
        @DisplayName("Chỉ có ảnh (không text) → lưu CommentImage")
        void imageOnly_shouldSaveImages() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(200L);
                return c;
            });

            CreateCommentRequest req = new CreateCommentRequest();
            req.setListingId(10L);
            req.setContent(null);
            req.setImageUrls(List.of("https://cdn/x.png"));

            commentService.createComment(req);

            verify(commentImageRepository).save(any(CommentImage.class));
            verify(commentRateLimitService).recordSuccess(1L);
        }
    }

    // -------------------------------------------------------------------------
    // replyToComment
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Trả lời bình luận (replyToComment)")
    class ReplyToComment {

        @Test
        @DisplayName("[Lỗi] Parent không tồn tại → COMMENT_NOT_FOUND")
        void parentMissing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(commentRepository.findById(5L)).thenReturn(Optional.empty());
            ReplyCommentRequest req = new ReplyCommentRequest();
            req.setContent("r");
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> commentService.replyToComment(5L, req));
            assertEquals(ErrorCode.COMMENT_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Parent không gắn listing → LISTING_NOT_FOUND")
        void parentNoListing_shouldThrow() {
            Comment parent = new Comment();
            parent.setId(5L);
            parent.setUser(user(2L));
            parent.setListing(null);
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            ReplyCommentRequest req = new ReplyCommentRequest();
            req.setContent("r");
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> commentService.replyToComment(5L, req));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Chặn với seller của listing → LISTING_NOT_FOUND")
        void blockedSeller_shouldThrow() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            Comment parent = comment(5L, seller, l, null);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            ReplyCommentRequest req = new ReplyCommentRequest();
            req.setContent("r");
            assertThrows(SlifeException.class, () -> commentService.replyToComment(5L, req));
        }

        @Test
        @DisplayName("[Lỗi] Chặn với tác giả comment gốc → FOLLOW_BLOCKED")
        void blockedParentAuthor_shouldThrow() {
            User replier = user(1L);
            User parentAuthor = user(3L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            Comment parent = comment(5L, parentAuthor, l, null);
            when(userService.getCurrentUser()).thenReturn(replier);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(blockService.isBlockedEitherDirection(1L, 3L)).thenReturn(true);
            ReplyCommentRequest req = new ReplyCommentRequest();
            req.setContent("r");
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> commentService.replyToComment(5L, req));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: notify tác giả parent và seller (khác nhau)")
        void happyPath_shouldNotifyParentAuthorAndSeller() {
            User replier = user(1L);
            User parentAuthor = user(3L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            Comment parent = comment(5L, parentAuthor, l, null);
            when(userService.getCurrentUser()).thenReturn(replier);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(50L);
                return c;
            });

            ReplyCommentRequest req = new ReplyCommentRequest();
            req.setContent("reply");

            commentService.replyToComment(5L, req);

            verify(notificationService).notifyListingCommentReply(parentAuthor, replier, 10L);
            verify(notificationService).notifyListingDiscussionJoined(seller, replier, 10L);
            verify(commentRateLimitService).recordSuccess(1L);
        }

        @Test
        @DisplayName("Trả lời chính comment của mình → không gửi notifyListingCommentReply")
        void replyToOwnComment_shouldNotNotifySelfAsParentAuthor() {
            User me = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            Comment parent = comment(5L, me, l, null);
            when(userService.getCurrentUser()).thenReturn(me);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(52L);
                return c;
            });
            ReplyCommentRequest req = new ReplyCommentRequest();
            req.setContent("self-reply");
            commentService.replyToComment(5L, req);
            verify(notificationService, never()).notifyListingCommentReply(any(), any(), anyLong());
            verify(notificationService).notifyListingDiscussionJoined(seller, me, 10L);
        }

        @Test
        @DisplayName("Seller là tác giả parent → chỉ notify reply, không notify discussion joined trùng")
        void sellerIsParentAuthor_shouldNotDuplicateSellerNotify() {
            User replier = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            Comment parent = comment(5L, seller, l, null);
            when(userService.getCurrentUser()).thenReturn(replier);
            when(commentRepository.findById(5L)).thenReturn(Optional.of(parent));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(51L);
                return c;
            });

            ReplyCommentRequest req = new ReplyCommentRequest();
            req.setContent("r2");

            commentService.replyToComment(5L, req);

            verify(notificationService).notifyListingCommentReply(seller, replier, 10L);
            verify(notificationService, never()).notifyListingDiscussionJoined(any(), eq(replier), eq(10L));
        }
    }

    // -------------------------------------------------------------------------
    // deleteComment
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Xóa bình luận (deleteComment)")
    class DeleteComment {

        @Test
        @DisplayName("[Lỗi] Không tồn tại → COMMENT_NOT_FOUND")
        void missing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(commentRepository.findById(9L)).thenReturn(Optional.empty());
            assertThrows(SlifeException.class, () -> commentService.deleteComment(9L));
        }

        @Test
        @DisplayName("[Lỗi] Không phải chủ / admin / chủ tin → COMMENT_DELETE_FORBIDDEN")
        void stranger_shouldThrow() {
            User owner = user(2L);
            User stranger = user(9L);
            User seller = user(3L);
            Listing l = listing(10L, seller);
            Comment c = comment(7L, owner, l, null);
            when(userService.getCurrentUser()).thenReturn(stranger);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.deleteComment(7L));
            assertEquals(ErrorCode.COMMENT_DELETE_FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Chủ comment xóa → xóa ảnh rồi xóa comment")
        void owner_shouldDelete() {
            User owner = user(2L);
            Listing l = listing(10L, user(3L));
            Comment c = comment(7L, owner, l, null);
            when(userService.getCurrentUser()).thenReturn(owner);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            when(commentImageRepository.findByComment_Id(7L)).thenReturn(List.of(new CommentImage()));

            commentService.deleteComment(7L);

            verify(commentImageRepository).deleteAll(anyList());
            verify(commentRepository).delete(c);
            verify(auditLogService, never()).logAdminCommentDelete(any(), anyLong(), any());
        }

        @Test
        @DisplayName("Chủ tin xóa comment của người khác → được phép")
        void listingOwner_shouldDelete() {
            User seller = user(3L);
            User author = user(2L);
            Listing l = listing(10L, seller);
            Comment c = comment(7L, author, l, null);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            when(commentImageRepository.findByComment_Id(7L)).thenReturn(List.of());

            commentService.deleteComment(7L);

            verify(commentRepository).delete(c);
        }

        @Test
        @DisplayName("ADMIN xóa → ghi audit log")
        void admin_shouldAudit() {
            User admin = user(99L, "ADMIN", "ACTIVE");
            User author = user(2L);
            Listing l = listing(10L, user(3L));
            Comment c = comment(7L, author, l, null);
            when(userService.getCurrentUser()).thenReturn(admin);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            when(commentImageRepository.findByComment_Id(7L)).thenReturn(List.of());

            commentService.deleteComment(7L);

            verify(auditLogService).logAdminCommentDelete(admin, 7L, 10L);
        }
    }

    // -------------------------------------------------------------------------
    // updateComment
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Sửa bình luận (updateComment)")
    class UpdateComment {

        @Test
        @DisplayName("[Lỗi] Comment không tồn tại → COMMENT_NOT_FOUND")
        void commentMissing_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(2L));
            when(commentRepository.findById(999L)).thenReturn(Optional.empty());
            UpdateCommentRequest req = new UpdateCommentRequest();
            req.setContent("x");
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.updateComment(999L, req));
            assertEquals(ErrorCode.COMMENT_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không text và không ảnh → INVALID_INPUT")
        void emptyContentNoImages_shouldThrow() {
            User owner = user(2L);
            Comment c = comment(7L, owner, listing(1L, user(3L)), null);
            when(userService.getCurrentUser()).thenReturn(owner);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            UpdateCommentRequest req = new UpdateCommentRequest();
            req.setContent("  ");
            req.setImageUrls(new ArrayList<>());
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.updateComment(7L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không phải chủ → FORBIDDEN")
        void notOwner_shouldThrow() {
            User owner = user(2L);
            User other = user(9L);
            Comment c = comment(7L, owner, listing(1L, user(3L)), null);
            when(userService.getCurrentUser()).thenReturn(other);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            UpdateCommentRequest req = new UpdateCommentRequest();
            req.setContent("x");
            SlifeException ex = assertThrows(SlifeException.class, () -> commentService.updateComment(7L, req));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: đổi nội dung; imageUrls != null (mặc định rỗng) → xóa ảnh cũ")
        void updateTextWithDefaultImageList_shouldClearImages() {
            User owner = user(2L);
            Comment c = comment(7L, owner, listing(1L, user(3L)), null);
            when(userService.getCurrentUser()).thenReturn(owner);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            when(commentImageRepository.findByComment_Id(7L)).thenReturn(List.of(new CommentImage()));
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCommentRequest req = new UpdateCommentRequest();
            req.setContent("mới");

            commentService.updateComment(7L, req);

            verify(commentImageRepository).deleteAll(anyList());
            assertEquals("mới", c.getContent());
        }

        @Test
        @DisplayName("Cập nhật kèm ảnh mới → lưu CommentImage")
        void updateWithImages_shouldSave() {
            User owner = user(2L);
            Comment c = comment(7L, owner, listing(1L, user(3L)), null);
            when(userService.getCurrentUser()).thenReturn(owner);
            when(commentRepository.findById(7L)).thenReturn(Optional.of(c));
            when(commentImageRepository.findByComment_Id(7L)).thenReturn(List.of());
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCommentRequest req = new UpdateCommentRequest();
            req.setContent("text");
            req.setImageUrls(List.of("https://a/b.png"));

            commentService.updateComment(7L, req);

            verify(commentImageRepository).save(any(CommentImage.class));
        }
    }

    // -------------------------------------------------------------------------
    // getCommentsForListing
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Danh sách bình luận theo tin (getCommentsForListing)")
    class GetCommentsForListing {

        @Test
        @DisplayName("[Lỗi] Listing không tồn tại → LISTING_NOT_FOUND")
        void listingMissing_shouldThrow() {
            when(listingRepository.findById(1L)).thenReturn(Optional.empty());
            assertThrows(SlifeException.class, () -> commentService.getCommentsForListing(1L));
        }

        @Test
        @DisplayName("[Lỗi] Viewer (không phải seller/admin) bị chặn với seller → LISTING_NOT_FOUND")
        void viewerBlockedSeller_shouldThrow() {
            User viewer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(userService.getCurrentUserOptional()).thenReturn(Optional.of(viewer));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> commentService.getCommentsForListing(10L));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không có comment → danh sách rỗng")
        void noComments_shouldReturnEmpty() {
            Listing l = listing(10L, user(2L));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(userService.getCurrentUserOptional()).thenReturn(Optional.empty());
            when(commentRepository.findByListing_IdOrderByCreatedAtAsc(10L)).thenReturn(List.of());

            assertTrue(commentService.getCommentsForListing(10L).isEmpty());
        }

        @Test
        @DisplayName("Cây comment + ảnh: root có reply, load image theo từng id")
        void treeAndImages_shouldMap() {
            User seller = user(2L);
            User a1 = user(3L);
            User a2 = user(4L);
            Listing l = listing(10L, seller);
            Comment root = comment(100L, a1, l, null);
            Comment reply = comment(101L, a2, l, root);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(userService.getCurrentUserOptional()).thenReturn(Optional.of(seller));
            when(commentRepository.findByListing_IdOrderByCreatedAtAsc(10L)).thenReturn(List.of(root, reply));

            CommentImage imgRoot = new CommentImage();
            imgRoot.setImageUrl("u1");
            when(commentImageRepository.findByComment_Id(100L)).thenReturn(List.of(imgRoot));
            when(commentImageRepository.findByComment_Id(101L)).thenReturn(List.of());

            List<CommentResponse> out = commentService.getCommentsForListing(10L);

            assertEquals(1, out.size());
            assertEquals(100L, out.get(0).getId());
            assertEquals(1, out.get(0).getReplies().size());
            assertEquals(101L, out.get(0).getReplies().get(0).getId());
            assertEquals(List.of("u1"), out.get(0).getImages());
        }

        @Test
        @DisplayName("Viewer thường: ẩn comment của user bị chặn và reply con")
        void publicViewer_blockFilter_shouldHideSubtree() {
            User viewer = user(1L);
            User seller = user(2L);
            User blockedAuthor = user(5L);
            Listing l = listing(10L, seller);
            Comment rootOk = comment(100L, seller, l, null);
            Comment rootBad = comment(200L, blockedAuthor, l, null);
            Comment childBad = comment(201L, viewer, l, rootBad);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(userService.getCurrentUserOptional()).thenReturn(Optional.of(viewer));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(blockService.isBlockedEitherDirection(1L, 5L)).thenReturn(true);
            when(blockService.isBlockedEitherDirection(1L, 1L)).thenReturn(false);
            when(commentRepository.findByListing_IdOrderByCreatedAtAsc(10L))
                    .thenReturn(List.of(rootOk, rootBad, childBad));
            when(commentImageRepository.findByComment_Id(anyLong())).thenReturn(List.of());

            List<CommentResponse> out = commentService.getCommentsForListing(10L);

            assertEquals(1, out.size());
            assertEquals(100L, out.get(0).getId());
        }

        @Test
        @DisplayName("ADMIN vẫn xem được comment dù có block với seller (không trả LISTING_NOT_FOUND)")
        void adminWithBlockRelationToSeller_shouldStillLoadComments() {
            User admin = user(99L, "ADMIN", "ACTIVE");
            User seller = user(2L);
            Listing l = listing(10L, seller);
            Comment root = comment(100L, seller, l, null);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(userService.getCurrentUserOptional()).thenReturn(Optional.of(admin));
            when(commentRepository.findByListing_IdOrderByCreatedAtAsc(10L)).thenReturn(List.of(root));
            when(commentImageRepository.findByComment_Id(100L)).thenReturn(List.of());

            List<CommentResponse> out = commentService.getCommentsForListing(10L);

            assertEquals(1, out.size());
            assertEquals(100L, out.get(0).getId());
        }

        @Test
        @DisplayName("Comment bị ẩn nội dung (hiddenAt) → placeholder và không trả images")
        void hiddenContent_shouldMask() {
            Listing l = listing(10L, user(2L));
            Comment root = comment(100L, user(3L), l, null);
            root.setHiddenAt(Instant.now());
            root.setContent("bad");
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(userService.getCurrentUserOptional()).thenReturn(Optional.empty());
            when(commentRepository.findByListing_IdOrderByCreatedAtAsc(10L)).thenReturn(List.of(root));
            CommentImage img = new CommentImage();
            img.setImageUrl("secret");
            when(commentImageRepository.findByComment_Id(100L)).thenReturn(List.of(img));

            List<CommentResponse> out = commentService.getCommentsForListing(10L);

            assertEquals(Boolean.TRUE, out.get(0).getContentHidden());
            assertTrue(out.get(0).getContent().contains("ẩn"));
            assertNull(out.get(0).getImages());
        }
    }
}

