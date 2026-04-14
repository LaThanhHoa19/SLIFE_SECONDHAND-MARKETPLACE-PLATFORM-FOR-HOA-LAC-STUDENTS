package com.slife.marketplace.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Publish WebSocket messages to Redis Pub/Sub channels.
 * Other instances subscribe and relay to their local WebSocket sessions.
 * <p>
 * Usage: call {@code publishToTopic} or {@code publishToUser} AFTER sending
 * via SimpMessagingTemplate locally. The Redis listener on other instances
 * will forward the message to their connected clients.
 */
@Service
public class RedisWebSocketRelayService {

    private static final Logger log = LoggerFactory.getLogger(RedisWebSocketRelayService.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisWebSocketRelayService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Publish a message to a STOMP topic via Redis (e.g., "/topic/chat.{sessionId}").
     */
    public void publishToTopic(String destination, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            redisTemplate.convertAndSend("ws:topic:" + destination, json);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize WS topic payload: {}", ex.getMessage());
        }
    }

    /**
     * Publish a user-specific message via Redis (e.g., user "abc@mail.com", destination "/queue/notifications").
     */
    public void publishToUser(String email, String destination, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            redisTemplate.convertAndSend("ws:user:" + email + ":" + destination, json);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize WS user payload: {}", ex.getMessage());
        }
    }
}
