package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.NotificationResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Notification;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private RedisWebSocketRelayService wsRelay;

    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(
                notificationRepository, conversationRepository, messageRepository, messagingTemplate, wsRelay
        );
    }

    private static User user(long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFullName("User " + id);
        return u;
    }

    @Nested
    @DisplayName("Function: notifyNewMessage")
    class NotifyNewMessageGroup {
        @Test
        @DisplayName("UTCID01 [Positive] - save and push")
        void utcId01_saveAndPush() {
            User recipient = user(1L, "a@ex.com");
            ChatMessageResponse msg = new ChatMessageResponse();
            msg.setId(10L);
            msg.setSenderName("Alice");
            when(notificationRepository.countUnreadByScope(1L, "ALL")).thenReturn(2L);

            service.notifyNewMessage(recipient, msg, "sess");

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(cap.capture());
            assertEquals("MESSAGE", cap.getValue().getRefType());
            assertEquals(10L, cap.getValue().getRefId());
            verify(messagingTemplate).convertAndSendToUser("a@ex.com", "/queue/notifications", 2L);
        }

        @Test
        @DisplayName("UTCID02 [Negative] - internal error swallowed")
        void utcId02_swallowError() {
            doThrow(new RuntimeException("down")).when(notificationRepository).save(any(Notification.class));
            assertDoesNotThrow(() -> service.notifyNewMessage(user(1L, "a@ex.com"), null, "sess"));
        }
    }

    @Nested
    @DisplayName("Function: notifyOfferProposal")
    class NotifyOfferProposalGroup {
        @Test
        @DisplayName("UTCID01 [Positive] - resolved conversation uses OFFER")
        void utcId01_useOffer() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            Conversation c = new Conversation();
            c.setId(99L);
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L)).thenReturn(Optional.of(c));
            when(notificationRepository.countUnreadByScope(2L, "ALL")).thenReturn(1L);

            service.notifyOfferProposal(seller, buyer, 10L, "title", new BigDecimal("900"));

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(cap.capture());
            assertEquals("OFFER", cap.getValue().getRefType());
            assertEquals(99L, cap.getValue().getRefId());
        }

        @Test
        @DisplayName("UTCID02 [Boundary] - missing conversation uses OFFER_CHAT")
        void utcId02_useOfferChat() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L)).thenReturn(Optional.empty());
            when(notificationRepository.countUnreadByScope(2L, "ALL")).thenReturn(1L);

            service.notifyOfferProposal(seller, buyer, 10L, "title", new BigDecimal("900"));

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(cap.capture());
            assertEquals("OFFER_CHAT", cap.getValue().getRefType());
            assertEquals(10L, cap.getValue().getRefId());
        }
    }

    @Nested
    @DisplayName("Function: getNotificationResponses")
    class GetNotificationResponsesGroup {
        @Test
        @DisplayName("UTCID01 [Positive] - conversation ref resolves session")
        void utcId01_resolveSession() {
            User u = user(1L, "a@ex.com");
            Notification n = new Notification();
            n.setId(1L);
            n.setUser(u);
            n.setType("DEAL");
            n.setRefType("CONVERSATION");
            n.setRefId(99L);
            n.setCreatedAt(Instant.now());
            when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n));
            Conversation c = new Conversation();
            c.setSessionUuid("sess-99");
            when(conversationRepository.findById(99L)).thenReturn(Optional.of(c));

            List<NotificationResponse> out = service.getNotificationResponses(1L);
            assertEquals("sess-99", out.get(0).getSessionId());
        }

        @Test
        @DisplayName("UTCID02 [Boundary] - null refs keep default mapping")
        void utcId02_nullRefs() {
            User u = user(1L, "a@ex.com");
            Notification n = new Notification();
            n.setId(1L);
            n.setUser(u);
            n.setType("SYSTEM");
            n.setRefType(null);
            n.setRefId(null);
            n.setCreatedAt(Instant.now());
            when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n));

            List<NotificationResponse> out = service.getNotificationResponses(1L);
            assertNotNull(out.get(0));
            verifyNoInteractions(conversationRepository);
        }
    }
}
