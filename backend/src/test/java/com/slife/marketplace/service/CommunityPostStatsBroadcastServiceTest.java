package com.slife.marketplace.service;

import com.slife.marketplace.repository.CommunityPostCommentRepository;
import com.slife.marketplace.repository.CommunityPostLikeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityPostStatsBroadcastServiceTest {

    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private CommunityPostLikeRepository likeRepository;
    @Mock private CommunityPostCommentRepository commentRepository;

    private CommunityPostStatsBroadcastService service;

    @BeforeEach
    void setUp() {
        service = new CommunityPostStatsBroadcastService(messagingTemplate, likeRepository, commentRepository);
    }

    @Test
    @DisplayName("broadcastStats: postId null -> no-op")
    void broadcast_nullPostId_noop() {
        service.broadcastStats(null);
        verifyNoInteractions(messagingTemplate, likeRepository, commentRepository);
    }

    @Test
    @DisplayName("broadcastStats: happy path -> convertAndSend payload chuẩn")
    void broadcast_happyPath() {
        when(likeRepository.countByPost_Id(10L)).thenReturn(7L);
        when(commentRepository.countByPost_IdAndDeletedAtIsNull(10L)).thenReturn(3L);

        service.broadcastStats(10L);

        ArgumentCaptor<Object> cap = ArgumentCaptor.forClass(Object.class);
        verify(messagingTemplate).convertAndSend(eq(CommunityPostStatsBroadcastService.TOPIC_COMMUNITY_POST_STATS), cap.capture());
        assertTrue(cap.getValue() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) cap.getValue();
        assertEquals(10L, payload.get("postId"));
        assertEquals(7L, payload.get("likeCount"));
        assertEquals(3L, payload.get("commentCount"));
    }

    @Test
    @DisplayName("broadcastStats: exception khi query/send -> swallow")
    void broadcast_exception_swallow() {
        when(likeRepository.countByPost_Id(10L)).thenThrow(new RuntimeException("db"));

        assertDoesNotThrow(() -> service.broadcastStats(10L));
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
}

