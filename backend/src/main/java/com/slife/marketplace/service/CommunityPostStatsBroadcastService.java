package com.slife.marketplace.service;

import com.slife.marketplace.repository.CommunityPostCommentRepository;
import com.slife.marketplace.repository.CommunityPostLikeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Đẩy số thích / bình luận realtime tới mọi client đang xem feed cộng đồng (STOMP topic).
 */
@Service
public class CommunityPostStatsBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(CommunityPostStatsBroadcastService.class);
    public static final String TOPIC_COMMUNITY_POST_STATS = "/topic/community/posts";

    private final SimpMessagingTemplate messagingTemplate;
    private final CommunityPostLikeRepository communityPostLikeRepository;
    private final CommunityPostCommentRepository communityPostCommentRepository;
    private final RedisWebSocketRelayService wsRelay;

    public CommunityPostStatsBroadcastService(SimpMessagingTemplate messagingTemplate,
                                              CommunityPostLikeRepository communityPostLikeRepository,
                                              CommunityPostCommentRepository communityPostCommentRepository,
                                              RedisWebSocketRelayService wsRelay) {
        this.messagingTemplate = messagingTemplate;
        this.communityPostLikeRepository = communityPostLikeRepository;
        this.communityPostCommentRepository = communityPostCommentRepository;
        this.wsRelay = wsRelay;
    }

    public void broadcastStats(Long postId) {
        if (postId == null) {
            return;
        }
        try {
            long likes = communityPostLikeRepository.countByPost_Id(postId);
            long comments = communityPostCommentRepository.countByPost_IdAndDeletedAtIsNull(postId);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "STATS");
            payload.put("postId", postId);
            payload.put("likeCount", likes);
            payload.put("commentCount", comments);
            messagingTemplate.convertAndSend(TOPIC_COMMUNITY_POST_STATS, payload);
            wsRelay.publishToTopic(TOPIC_COMMUNITY_POST_STATS, payload);
        } catch (Exception ex) {
            log.warn("broadcast community post stats failed postId={}", postId, ex);
        }
    }

    public void broadcastSavedToggled(Long postId, Long userId, boolean saved) {
        if (postId == null || userId == null) {
            return;
        }
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "SAVED_TOGGLED");
            payload.put("postId", postId);
            payload.put("userId", userId);
            payload.put("saved", saved);
            messagingTemplate.convertAndSend(TOPIC_COMMUNITY_POST_STATS, payload);
            wsRelay.publishToTopic(TOPIC_COMMUNITY_POST_STATS, payload);
        } catch (Exception ex) {
            log.warn("broadcast community post saved toggle failed postId={}, userId={}", postId, userId, ex);
        }
    }

    public void broadcastLikedToggled(Long postId, Long userId, boolean liked) {
        if (postId == null || userId == null) {
            return;
        }
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "LIKED_TOGGLED");
            payload.put("postId", postId);
            payload.put("userId", userId);
            payload.put("liked", liked);
            messagingTemplate.convertAndSend(TOPIC_COMMUNITY_POST_STATS, payload);
            wsRelay.publishToTopic(TOPIC_COMMUNITY_POST_STATS, payload);
        } catch (Exception ex) {
            log.warn("broadcast community post liked toggle failed postId={}, userId={}", postId, userId, ex);
        }
    }

    public void broadcastPostDeleted(Long postId) {
        if (postId == null) {
            return;
        }
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "POST_DELETED");
            payload.put("postId", postId);
            messagingTemplate.convertAndSend(TOPIC_COMMUNITY_POST_STATS, payload);
            wsRelay.publishToTopic(TOPIC_COMMUNITY_POST_STATS, payload);
        } catch (Exception ex) {
            log.warn("broadcast community post deleted failed postId={}", postId, ex);
        }
    }
}
