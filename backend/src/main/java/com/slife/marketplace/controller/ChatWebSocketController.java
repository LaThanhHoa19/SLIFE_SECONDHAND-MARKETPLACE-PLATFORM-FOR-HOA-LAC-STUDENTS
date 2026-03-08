package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * Handles STOMP /app/chat.send. Payload: sessionId, content.
 * Sends real-time update to /user/queue/messages for the recipient.
 */
@Controller
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    public ChatWebSocketController(ChatService chatService,
                                  SimpMessagingTemplate messagingTemplate,
                                  UserRepository userRepository,
                                  ConversationRepository conversationRepository) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
    }

    @MessageMapping("chat.send")
    public void sendMessage(@Payload Map<String, String> payload, Principal principal) {
        String sessionId = payload != null ? payload.get("sessionId") : null;
        String content = payload != null ? payload.get("content") : null;
        if (sessionId == null || (content == null || content.isBlank())) {
            return;
        }
        String principalName = principal != null ? principal.getName() : null;
        if (principalName == null || principalName.isBlank()) {
            return;
        }
        User sender = userRepository.findByEmail(principalName).orElse(null);
        if (sender == null) {
            return;
        }
        ChatMessageResponse response = chatService.sendMessage(sessionId, content, sender);
        Conversation conv = conversationRepository.findBySessionUuid(sessionId).orElse(null);
        if (conv != null) {
            User other = conv.getUserId1().getId().equals(sender.getId()) ? conv.getUserId2() : conv.getUserId1();
            String recipientEmail = other.getEmail();
            if (recipientEmail != null) {
                messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/messages", response);
            }
        }
    }
}
