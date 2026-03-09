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
 *  - BR-34: rejects BANNED users on CONNECT and every SEND.
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final UserRepository userRepository;

    public JwtChannelInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand cmd = accessor.getCommand();

        if (StompCommand.SEND.equals(cmd)) {
            String dest = accessor.getDestination();
            if (dest != null && dest.startsWith("/app/")) {
                String email = accessor.getUser() != null ? accessor.getUser().getName() : null;
                if (email == null || email.isBlank())
                    throw new AccessDeniedException("JWT required for chat");
                checkNotBanned(email);
            }
        }

        if (StompCommand.CONNECT.equals(cmd)) {
            String email = accessor.getUser() != null ? accessor.getUser().getName() : null;
            if (email != null && !email.isBlank()) checkNotBanned(email);
        }

        return message;
    }

    private void checkNotBanned(String email) {
        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isPresent() && "BANNED".equals(opt.get().getStatus()))
            throw new AccessDeniedException("Your account has been banned (BR-34)");
    }
}
