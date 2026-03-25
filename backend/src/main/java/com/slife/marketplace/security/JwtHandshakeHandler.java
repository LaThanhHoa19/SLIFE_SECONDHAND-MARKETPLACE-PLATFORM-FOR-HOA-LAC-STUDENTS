package com.slife.marketplace.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/**
 * Validates JWT during WebSocket handshake and sets principal (user email) for the session.
 * Client should connect with token in query: ws://host/chat?token=JWT
 */
public class JwtHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtHandshakeHandler(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            var req = servletRequest.getServletRequest();
            String token = req.getParameter("token");
            if (token == null || token.isBlank()) {
                String auth = req.getHeader("Authorization");
                if (auth != null && auth.regionMatches(true, 0, "Bearer ", 0, 7)) {
                    token = auth.substring(7).trim();
                }
            }
            if (token != null && !token.isBlank() && jwtTokenProvider.isTokenValid(token)) {
                String email = jwtTokenProvider.parseToken(token).getSubject();
                if (email != null && !email.isBlank()) {
                    return () -> email;
                }
            }
        }
        return null;
    }
}
