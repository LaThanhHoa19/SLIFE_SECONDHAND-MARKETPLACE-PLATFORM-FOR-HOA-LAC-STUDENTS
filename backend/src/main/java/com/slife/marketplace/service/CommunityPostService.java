package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommunityPostRequest;
import com.slife.marketplace.dto.request.UpdateCommunityPostRequest;
import com.slife.marketplace.dto.response.CommunityPostCardResponse;
import com.slife.marketplace.dto.response.CommunityPostResponse;
import com.slife.marketplace.dto.response.CursorPageResponse;
import com.slife.marketplace.dto.response.ListingImageItemResponse;
import com.slife.marketplace.dto.response.PagedResponse;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CommunityPostService {

    private static final int DEFAULT_MAX_IMAGES_PER_POST = 10;

    public static final int MAX_DESCRIPTION_LENGTH = 1000;

    /**
     * # phải đứng sau đầu chuỗi hoặc ký tự không phải chữ/số/_/#; thân tag: chữ (Unicode), số, gạch dưới, tối đa 100.
     */
    private static final Pattern DESCRIPTION_HASHTAG_PATTERN = Pattern.compile(
            "(?:^|[^#\\p{L}\\p{N}_])#([\\p{L}\\p{N}_]{1,100})(?=[^\\p{L}\\p{N}_]|$)",
            Pattern.UNICODE_CHARACTER_CLASS | Pattern.MULTILINE);

    private final CommunityPostRepository communityPostRepository;
    private final CommunityPostImageRepository communityPostImageRepository;
    private final CommunityPostLikeRepository communityPostLikeRepository;
    private final CommunityPostCommentRepository communityPostCommentRepository;
    private final HashtagRepository hashtagRepository;
    private final SavedCommunityPostRepository savedCommunityPostRepository;
    private final CommunityPostImageService communityPostImageService;
    private final BlockService blockService;
    private final ConfigService configService;
    private final ContentModerationService contentModerationService;
    private final CommunityPostStatsBroadcastService communityPostStatsBroadcastService;

    public int getMaxImagesPerPost() {
        int perPost = Math.max(1, configService.getIntConfigValue("MAX_IMAGES_PER_POST", DEFAULT_MAX_IMAGES_PER_POST));
        int systemCap = Math.max(1, configService.getIntConfigValue("MAX_IMAGES", perPost));
        return Math.min(perPost, systemCap);
    }

    @Transactional
    public CommunityPostResponse createPostWithImages(User author, CreateCommunityPostRequest request,
                                                      List<MultipartFile> images) {
        if (author == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        List<MultipartFile> imageParts = nonEmptyImageParts(images);
        int maxPerPost = getMaxImagesPerPost();
        if (!imageParts.isEmpty() && imageParts.size() > maxPerPost) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, Constants.MSG18);
        }

        contentModerationService.assertNoBannedKeywords("", trimToNull(request.getDescription()));

        CommunityPost post = new CommunityPost();
        post.setAuthor(author);
        post.setDescription(trimToNull(request.getDescription()));
        post.setStatus(CommunityPost.STATUS_ACTIVE);
        post.setViewCount(0L);
        Instant now = Instant.now();
        post.setCreatedAt(now);
        post.setUpdatedAt(now);

        CommunityPost saved = communityPostRepository.save(post);
        syncHashtags(saved, mergeHashtagSources(request.getHashtags(), saved.getDescription()));
        communityPostRepository.save(saved);

        if (!imageParts.isEmpty()) {
            communityPostImageService.uploadPostImages(saved.getId(), imageParts, author);
        }

        log.info("createCommunityPost: id={}, author={}", saved.getId(), author.getId());
        return buildDetailResponse(saved.getId(), author);
    }

    @Transactional
    public CommunityPostResponse updatePost(Long postId, User author, UpdateCommunityPostRequest request) {
        CommunityPost post = loadOwnedPost(postId, author);
        if (request.getDescription() != null) {
            post.setDescription(trimToNull(request.getDescription()));
        }
        contentModerationService.assertNoBannedKeywords("", post.getDescription());
        if (request.getDescription() != null || request.getHashtags() != null) {
            List<String> explicit = request.getHashtags() != null ? request.getHashtags() : List.of();
            syncHashtags(post, mergeHashtagSources(explicit, post.getDescription()));
        }
        post.setUpdatedAt(Instant.now());
        communityPostRepository.save(post);
        return buildDetailResponse(postId, author);
    }

    @Transactional
    public void softDeletePost(Long postId, User author) {
        CommunityPost post = loadOwnedPost(postId, author);
        post.setDeletedAt(Instant.now());
        post.setStatus(CommunityPost.STATUS_DELETED);
        post.setUpdatedAt(Instant.now());
        communityPostRepository.save(post);
        communityPostStatsBroadcastService.broadcastPostDeleted(post.getId());
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommunityPostCardResponse> getMine(User user, int page, int size) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        int pageIdx = Math.max(page, 0);
        int s = size > 0 ? Math.min(size, 50) : 20;
        Pageable pageable = PageRequest.of(pageIdx, s);
        Page<CommunityPost> pageResult = communityPostRepository.findMineVisibleByAuthorId(user.getId(), pageable);
        return toCardPage(pageResult, user.getId(), false);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommunityPostCardResponse> getByAuthor(Long authorId, int page, int size, User viewer) {
        int pageIdx = Math.max(page, 0);
        int s = size > 0 ? Math.min(size, 50) : 20;
        Long viewerId = viewer != null ? viewer.getId() : null;
        Pageable pageable = PageRequest.of(pageIdx, s);
        Page<CommunityPost> pageResult = communityPostRepository.findVisibleByAuthorIdForViewer(
                authorId, CommunityPost.STATUS_ACTIVE, viewerId, pageable);
        return toCardPage(pageResult, viewerId, false);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommunityPostCardResponse> getFeed(int page, int size, String hashtag, String sort, User viewer) {
        int pageIdx = Math.max(page, 0);
        int s = size > 0 ? Math.min(size, 50) : 20;
        Long viewerId = viewer != null ? viewer.getId() : null;
        String normSort = sort == null ? "latest" : sort.trim().toLowerCase(Locale.ROOT);
        boolean top = "top".equals(normSort) || "popular".equals(normSort);
        String normTag = normalizeHashtagFilterParam(hashtag);

        Pageable pageable;
        Page<CommunityPost> pageResult;
        if (normTag != null) {
            pageable = PageRequest.of(pageIdx, s);
            if (top) {
                pageResult = communityPostRepository.findVisibleForViewerByHashtagTop(
                        CommunityPost.STATUS_ACTIVE, normTag, viewerId, pageable);
            } else {
                pageResult = communityPostRepository.findVisibleForViewerByHashtagLatest(
                        CommunityPost.STATUS_ACTIVE, normTag, viewerId, pageable);
            }
        } else if (top) {
            pageable = PageRequest.of(pageIdx, s);
            pageResult = communityPostRepository.findVisibleForViewerTop(
                    CommunityPost.STATUS_ACTIVE, viewerId, pageable);
        } else {
            pageable = PageRequest.of(pageIdx, s, Sort.by(Sort.Direction.DESC, "createdAt"));
            pageResult = communityPostRepository.findVisibleForViewer(
                    CommunityPost.STATUS_ACTIVE, viewerId, pageable);
        }

        return toCardPage(pageResult, viewerId, false);
    }

    @Transactional(readOnly = true)
    public CursorPageResponse<CommunityPostCardResponse> getFeedCursor(int limit, String cursor, String hashtag, String sort, User viewer) {
        int size = Math.max(1, Math.min(limit, 30));
        Long viewerId = viewer != null ? viewer.getId() : null;
        String normSort = sort == null ? "latest" : sort.trim().toLowerCase(Locale.ROOT);
        boolean top = "top".equals(normSort) || "popular".equals(normSort);
        String normTag = normalizeHashtagFilterParam(hashtag);

        Pageable pageable = PageRequest.of(0, size);
        List<CommunityPost> posts;
        String nextCursor = null;
        boolean hasMore;

        if (!top) {
            CommunityPostCursorCodec.LatestCursor c = CommunityPostCursorCodec.decodeLatest(cursor);
            Instant cursorCreatedAt = c != null ? c.createdAt() : null;
            Long cursorId = c != null ? c.id() : null;
            if (normTag != null) {
                posts = communityPostRepository.findVisibleForViewerByHashtagCursorLatest(
                        CommunityPost.STATUS_ACTIVE, normTag, viewerId, cursorCreatedAt, cursorId, pageable);
            } else {
                posts = communityPostRepository.findVisibleForViewerCursorLatest(
                        CommunityPost.STATUS_ACTIVE, viewerId, cursorCreatedAt, cursorId, pageable);
            }
            hasMore = posts.size() == size;
        } else {
            CommunityPostCursorCodec.TopCursor c = CommunityPostCursorCodec.decodeTop(cursor);
            Long cursorScore = c != null ? c.score() : null;
            Instant cursorCreatedAt = c != null ? c.createdAt() : null;
            Long cursorId = c != null ? c.id() : null;
            if (normTag != null) {
                posts = communityPostRepository.findVisibleForViewerByHashtagCursorTop(
                        CommunityPost.STATUS_ACTIVE, normTag, viewerId, cursorScore, cursorCreatedAt, cursorId, pageable);
            } else {
                posts = communityPostRepository.findVisibleForViewerCursorTop(
                        CommunityPost.STATUS_ACTIVE, viewerId, cursorScore, cursorCreatedAt, cursorId, pageable);
            }
            hasMore = posts.size() == size;
        }

        List<Long> ids = posts.stream().map(CommunityPost::getId).filter(Objects::nonNull).toList();
        Map<Long, String> thumbByPost = firstThumbByPostId(ids);
        Map<Long, List<String>> imageUrlsByPost = imageUrlsByPostId(ids);
        Map<Long, Long> likes = toCountMap(communityPostLikeRepository.countLikesByPostIds(ids));
        Map<Long, Long> comments = toCountMap(communityPostCommentRepository.countCommentsByPostIds(ids));
        Set<Long> likedByViewer = new HashSet<>();
        Set<Long> savedByViewer = new HashSet<>();
        if (viewerId != null && !ids.isEmpty()) {
            likedByViewer.addAll(communityPostLikeRepository.findPostIdsLikedByUser(viewerId, ids));
            savedByViewer.addAll(savedCommunityPostRepository.findSavedPostIdsByUserAndPostIds(viewerId, ids));
        }

        List<CommunityPostCardResponse> cards = posts.stream()
                .map(p -> toCard(p, thumbByPost, imageUrlsByPost, likes, comments, viewerId, likedByViewer, savedByViewer))
                .collect(Collectors.toList());

        if (hasMore && !posts.isEmpty()) {
            CommunityPost last = posts.get(posts.size() - 1);
            if (!top) {
                nextCursor = CommunityPostCursorCodec.encodeLatest(last.getCreatedAt(), last.getId());
            } else {
                long score = likes.getOrDefault(last.getId(), 0L) + comments.getOrDefault(last.getId(), 0L);
                nextCursor = CommunityPostCursorCodec.encodeTop(score, last.getCreatedAt(), last.getId());
            }
        }

        return new CursorPageResponse<>(cards, nextCursor, hasMore);
    }

    @Transactional
    public CommunityPostResponse getById(Long postId, User viewer) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        if (post.getDeletedAt() != null) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }
        boolean owner = viewer != null && post.getAuthor() != null
                && post.getAuthor().getId().equals(viewer.getId());
        boolean admin = viewer != null && "ADMIN".equalsIgnoreCase(viewer.getRole());
        if (post.getHiddenAt() != null && !owner && !admin) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }
        if (viewer != null && post.getAuthor() != null
                && blockService.isBlockedByCurrentUser(post.getAuthor().getId(), viewer.getId())) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }

        if (owner || admin || post.getHiddenAt() == null) {
            communityPostRepository.incrementViewCount(postId);
        }
        return buildDetailResponse(postId, viewer);
    }

    private CommunityPost loadOwnedPost(Long postId, User author) {
        if (author == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        if (post.getDeletedAt() != null) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }
        if (post.getAuthor() == null || !post.getAuthor().getId().equals(author.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        return post;
    }

    private CommunityPostResponse buildDetailResponse(Long postId, User viewer) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        List<CommunityPostImage> imgs = communityPostImageRepository.findByPost_IdOrderByDisplayOrderAsc(postId);
        List<String> urls = imgs.stream().map(CommunityPostImage::getImageUrl).toList();
        List<ListingImageItemResponse> items = imgs.stream()
                .map(i -> new ListingImageItemResponse(i.getId(), i.getImageUrl()))
                .toList();

        List<String> tagStrings = post.getHashtags().stream().map(Hashtag::getTag).sorted().toList();

        long likeCount = communityPostLikeRepository.countByPost_Id(postId);
        long commentCount = communityPostCommentRepository.countByPost_IdAndDeletedAtIsNull(postId);

        Boolean isLiked = null;
        if (viewer != null) {
            isLiked = communityPostLikeRepository.existsByUser_IdAndPost_Id(viewer.getId(), postId);
        }

        User a = post.getAuthor();
        Map<String, Object> authorSummary = Map.of(
                "userId", a.getId(),
                "fullName", a.getFullName() != null ? a.getFullName() : "",
                "avatarUrl", a.getAvatarUrl() != null ? a.getAvatarUrl() : "");

        CommunityPostResponse r = new CommunityPostResponse();
        r.setId(post.getId());
        r.setDescription(post.getDescription());
        r.setStatus(post.getStatus());
        r.setViewCount(post.getViewCount());
        r.setCreatedAt(post.getCreatedAt());
        r.setUpdatedAt(post.getUpdatedAt());
        r.setImages(urls);
        r.setImageItems(items);
        r.setAuthorSummary(authorSummary);
        r.setHashtags(tagStrings);
        r.setLikeCount(likeCount);
        r.setIsLiked(isLiked);
        r.setCommentCount(commentCount);
        return r;
    }

    public PagedResponse<CommunityPostCardResponse> toCardPage(Page<CommunityPost> pageResult, Long viewerId, boolean forceSavedTrue) {
        List<CommunityPost> posts = pageResult.getContent();
        List<Long> ids = posts.stream().map(CommunityPost::getId).filter(Objects::nonNull).toList();
        Map<Long, String> thumbByPost = firstThumbByPostId(ids);
        Map<Long, List<String>> imageUrlsByPost = imageUrlsByPostId(ids);
        Map<Long, Long> likes = toCountMap(communityPostLikeRepository.countLikesByPostIds(ids));
        Map<Long, Long> comments = toCountMap(communityPostCommentRepository.countCommentsByPostIds(ids));
        Set<Long> likedByViewer = new HashSet<>();
        Set<Long> savedByViewer = new HashSet<>();
        if (viewerId != null && !ids.isEmpty()) {
            likedByViewer.addAll(communityPostLikeRepository.findPostIdsLikedByUser(viewerId, ids));
            savedByViewer.addAll(savedCommunityPostRepository.findSavedPostIdsByUserAndPostIds(viewerId, ids));
        }

        List<CommunityPostCardResponse> cards = posts.stream()
                .map(p -> toCard(p, thumbByPost, imageUrlsByPost, likes, comments, viewerId, likedByViewer, savedByViewer, forceSavedTrue))
                .collect(Collectors.toList());

        return new PagedResponse<>(
                cards,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages());
    }

    private CommunityPostCardResponse toCard(CommunityPost p,
                                             Map<Long, String> thumbByPost,
                                             Map<Long, List<String>> imageUrlsByPost,
                                             Map<Long, Long> likes,
                                             Map<Long, Long> comments,
                                             Long viewerId,
                                             Set<Long> likedByViewer,
                                             Set<Long> savedByViewer) {
        return toCard(p, thumbByPost, imageUrlsByPost, likes, comments, viewerId, likedByViewer, savedByViewer, false);
    }

    private CommunityPostCardResponse toCard(CommunityPost p,
                                             Map<Long, String> thumbByPost,
                                             Map<Long, List<String>> imageUrlsByPost,
                                             Map<Long, Long> likes,
                                             Map<Long, Long> comments,
                                             Long viewerId,
                                             Set<Long> likedByViewer,
                                             Set<Long> savedByViewer,
                                             boolean forceSavedTrue) {
        Long id = p.getId();
        User a = p.getAuthor();
        List<String> tags = p.getHashtags().stream().map(Hashtag::getTag).sorted().toList();
        Boolean isLiked = viewerId == null ? null : likedByViewer.contains(id);
        Boolean isSaved = viewerId == null ? null : (forceSavedTrue || savedByViewer.contains(id));
        return new CommunityPostCardResponse(
                id,
                p.getDescription(),
                thumbByPost.get(id),
                imageUrlsByPost.getOrDefault(id, List.of()),
                p.getCreatedAt(),
                a != null ? a.getId() : null,
                a != null ? a.getFullName() : null,
                a != null ? a.getAvatarUrl() : null,
                likes.getOrDefault(id, 0L),
                comments.getOrDefault(id, 0L),
                tags,
                isLiked,
                isSaved);
    }

    private Map<Long, String> firstThumbByPostId(List<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        List<CommunityPostImage> imgs = communityPostImageRepository.findByPost_IdInOrderByPost_IdAscDisplayOrderAsc(ids);
        Map<Long, String> m = new HashMap<>();
        for (CommunityPostImage i : imgs) {
            Long pid = i.getPost().getId();
            m.putIfAbsent(pid, i.getImageUrl());
        }
        return m;
    }

    private Map<Long, List<String>> imageUrlsByPostId(List<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        List<CommunityPostImage> imgs = communityPostImageRepository.findByPost_IdInOrderByPost_IdAscDisplayOrderAsc(ids);
        Map<Long, List<String>> m = new HashMap<>();
        for (CommunityPostImage i : imgs) {
            Long pid = i.getPost().getId();
            m.computeIfAbsent(pid, __ -> new ArrayList<>()).add(i.getImageUrl());
        }
        return m;
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> m = new HashMap<>();
        if (rows == null) {
            return m;
        }
        for (Object[] r : rows) {
            if (r != null && r.length >= 2 && r[0] != null && r[1] != null) {
                m.put((Long) r[0], (Long) r[1]);
            }
        }
        return m;
    }

    private void syncHashtags(CommunityPost post, List<String> raw) {
        post.getHashtags().clear();
        if (raw == null || raw.isEmpty()) {
            return;
        }
        LinkedHashSet<String> uniq = new LinkedHashSet<>();
        for (String r : raw) {
            String n = normalizeHashtag(r);
            if (n != null) {
                uniq.add(n);
            }
        }
        for (String tag : uniq) {
            Hashtag h = hashtagRepository.findByTag(tag).orElseGet(() -> {
                Hashtag x = new Hashtag();
                x.setTag(tag);
                x.setCreatedAt(Instant.now());
                return hashtagRepository.save(x);
            });
            post.getHashtags().add(h);
        }
    }

    /**
     * Thứ tự: các lần bắt # trong mô tả (trái → phải, trùng nhau vẫn tính), sau đó hashtag gửi kèm request (API).
     */
    private static List<String> mergeHashtagSources(List<String> explicitFromRequest, String description) {
        List<String> out = new ArrayList<>();
        out.addAll(extractHashtagBodiesFromDescription(description));
        if (explicitFromRequest != null) {
            out.addAll(explicitFromRequest);
        }
        return out;
    }

    private static List<String> extractHashtagBodiesFromDescription(String description) {
        if (description == null || description.isBlank()) {
            return List.of();
        }
        List<String> found = new ArrayList<>();
        Matcher m = DESCRIPTION_HASHTAG_PATTERN.matcher(description);
        while (m.find()) {
            found.add(m.group(1));
        }
        return found;
    }

    /** Chuẩn hóa tham số lọc hashtag (query / path); null nếu không hợp lệ. */
    private static String normalizeHashtagFilterParam(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        if (t.isEmpty()) {
            return null;
        }
        if (!t.startsWith("#")) {
            t = "#" + t;
        }
        return normalizeHashtag(t);
    }

    /**
     * Chuẩn hóa hashtag: không khoảng trắng, không ký tự đặc biệt; chỉ chữ Unicode, số, gạch dưới; chữ thường.
     */
    private static String normalizeHashtag(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        if (s.startsWith("#")) {
            s = s.substring(1).trim();
        }
        if (s.isEmpty()) {
            return null;
        }
        for (int i = 0; i < s.length(); i++) {
            if (Character.isWhitespace(s.charAt(i))) {
                return null;
            }
        }
        s = s.toLowerCase(Locale.ROOT);
        if (s.length() > 100) {
            s = s.substring(0, 100);
        }
        if (!s.matches("[\\p{L}\\p{N}_]+")) {
            return null;
        }
        return s;
    }

    private static String trimToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private static List<MultipartFile> nonEmptyImageParts(List<MultipartFile> images) {
        if (images == null) {
            return List.of();
        }
        return images.stream().filter(f -> f != null && !f.isEmpty()).toList();
    }
}
