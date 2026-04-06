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

    public CommunityPostStatsBroadcastService(SimpMessagingTemplate messagingTemplate,
                                              CommunityPostLikeRepository communityPostLikeRepository,
                                              CommunityPostCommentRepository communityPostCommentRepository) {
        this.messagingTemplate = messagingTemplate;
        this.communityPostLikeRepository = communityPostLikeRepository;
        this.communityPostCommentRepository = communityPostCommentRepository;
    }

    public void broadcastStats(Long postId) {
        if (postId == null) {
            return;
        }
        try {
            long likes = communityPostLikeRepository.countByPost_Id(postId);
            long comments = communityPostCommentRepository.countByPost_IdAndDeletedAtIsNull(postId);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("postId", postId);
            payload.put("likeCount", likes);
            payload.put("commentCount", comments);
            messagingTemplate.convertAndSend(TOPIC_COMMUNITY_POST_STATS, payload);
        } catch (Exception ex) {
            log.warn("broadcast community post stats failed postId={}", postId, ex);
        }
    }
}
