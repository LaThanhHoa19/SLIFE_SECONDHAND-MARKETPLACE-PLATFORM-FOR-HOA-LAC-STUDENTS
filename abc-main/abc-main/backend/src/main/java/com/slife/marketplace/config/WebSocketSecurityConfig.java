package com.slife.marketplace.config;

import com.slife.marketplace.security.JwtHandshakeHandler;
import com.slife.marketplace.security.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WebSocketSecurityConfig {

    @Bean
    public JwtHandshakeHandler jwtHandshakeHandler(JwtTokenProvider jwtTokenProvider) {
        return new JwtHandshakeHandler(jwtTokenProvider);
    }
}
