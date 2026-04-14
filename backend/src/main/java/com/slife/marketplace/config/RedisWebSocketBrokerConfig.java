package com.slife.marketplace.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.context.annotation.Bean;

/**
 * Redis Pub/Sub relay cho WebSocket messages.
 * Khi một instance gửi message qua WebSocket, nó cũng publish lên Redis channel.
 * Tất cả instance subscribe channel đó và forward tới local WebSocket sessions.
 */
@Configuration
public class RedisWebSocketBrokerConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisWebSocketBrokerConfig.class);
    public static final String WS_TOPIC_CHANNEL = "ws:topic:*";
    public static final String WS_USER_CHANNEL = "ws:user:*";

    @Bean
    public RedisMessageListenerContainer redisWsListenerContainer(
            RedisConnectionFactory connectionFactory,
            SimpMessagingTemplate messagingTemplate,
            ObjectMapper objectMapper) {

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // Listen for topic messages (broadcast)
        container.addMessageListener(new TopicRelayListener(messagingTemplate, objectMapper),
                new PatternTopic(WS_TOPIC_CHANNEL));

        // Listen for user-specific messages
        container.addMessageListener(new UserRelayListener(messagingTemplate, objectMapper),
                new PatternTopic(WS_USER_CHANNEL));

        return container;
    }

    /**
     * Relay messages from Redis channel "ws:topic:{destination}" to local STOMP topic.
     */
    static class TopicRelayListener implements MessageListener {
        private final SimpMessagingTemplate messagingTemplate;
        private final ObjectMapper objectMapper;

        TopicRelayListener(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
            this.messagingTemplate = messagingTemplate;
            this.objectMapper = objectMapper;
        }

        @Override
        public void onMessage(Message message, byte[] pattern) {
            try {
                String channel = new String(message.getChannel());
                // channel = "ws:topic:/topic/chat.xxx" → destination = "/topic/chat.xxx"
                String destination = channel.substring("ws:topic:".length());
                String body = new String(message.getBody());
                messagingTemplate.convertAndSend(destination, body);
            } catch (Exception ex) {
                log.warn("TopicRelayListener error: {}", ex.getMessage());
            }
        }
    }

    /**
     * Relay messages from Redis channel "ws:user:{email}:{destination}" to local STOMP user queue.
     */
    static class UserRelayListener implements MessageListener {
        private final SimpMessagingTemplate messagingTemplate;
        private final ObjectMapper objectMapper;

        UserRelayListener(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
            this.messagingTemplate = messagingTemplate;
            this.objectMapper = objectMapper;
        }

        @Override
        public void onMessage(Message message, byte[] pattern) {
            try {
                String channel = new String(message.getChannel());
                // channel = "ws:user:{email}:{destination}" → parse email and destination
                String remainder = channel.substring("ws:user:".length());
                int sepIdx = remainder.indexOf(":/");
                if (sepIdx < 0) return;
                String email = remainder.substring(0, sepIdx);
                String destination = remainder.substring(sepIdx + 1);
                String body = new String(message.getBody());
                messagingTemplate.convertAndSendToUser(email, destination, body);
            } catch (Exception ex) {
                log.warn("UserRelayListener error: {}", ex.getMessage());
            }
        }
    }
}
