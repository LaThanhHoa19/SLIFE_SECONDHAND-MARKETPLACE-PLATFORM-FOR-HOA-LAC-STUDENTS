package com.slife.marketplace.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Validates that /app/** messages have an authenticated principal (JWT was valid at handshake).
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.SEND.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/app/")) {
                if (accessor.getUser() == null || accessor.getUser().getName() == null || accessor.getUser().getName().isBlank()) {
                    throw new org.springframework.security.access.AccessDeniedException("JWT required for chat");
                }
            }
        }
        return message;
    }
}
