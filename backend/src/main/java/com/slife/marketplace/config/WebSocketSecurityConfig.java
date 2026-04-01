package com.slife.marketplace.config;

import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.security.JwtHandshakeHandler;
import com.slife.marketplace.security.JwtTokenProvider;
import com.slife.marketplace.security.JwtUserSessionValidator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WebSocketSecurityConfig {

    @Bean
    public JwtHandshakeHandler jwtHandshakeHandler(JwtTokenProvider jwtTokenProvider,
                                                   UserRepository userRepository,
                                                   JwtUserSessionValidator sessionValidator) {
        return new JwtHandshakeHandler(jwtTokenProvider, userRepository, sessionValidator);
    }
}
