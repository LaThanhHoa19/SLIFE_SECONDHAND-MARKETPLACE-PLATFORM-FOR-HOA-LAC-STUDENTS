package com.slife.marketplace.security;

import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.UserRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Guards /app/** STOMP destinations:
 *  - Requires a valid JWT principal (set at handshake by JwtHandshakeHandler).
 *  - BR-34: immediately rejects connections from BANNED users.
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final UserRepository userRepository;

    public JwtChannelInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();

        // Require auth for any SEND to /app/**
        if (StompCommand.SEND.equals(command)) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/app/")) {
                String principalName = accessor.getUser() != null ? accessor.getUser().getName() : null;
                if (principalName == null || principalName.isBlank()) {
                    throw new AccessDeniedException("JWT required for chat");
                }
                // BR-34: check BANNED status on every message
                checkNotBanned(principalName);
            }
        }

        // BR-34: also check on CONNECT (to refuse initial handshake for banned users)
        if (StompCommand.CONNECT.equals(command)) {
            String principalName = accessor.getUser() != null ? accessor.getUser().getName() : null;
            if (principalName != null && !principalName.isBlank()) {
                checkNotBanned(principalName);
            }
        }

        return message;
    }

    private void checkNotBanned(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            String status = userOpt.get().getStatus();
            if ("BANNED".equals(status)) {
                throw new AccessDeniedException("Your account has been banned (BR-34)");
            }
        }
    }
}
