package com.slife.marketplace.security;

import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String jwt = resolveToken(request);
        String path = request.getRequestURI();
        if (path != null && path.startsWith("/api/users")) {
            log.debug("JwtAuthFilter {} - hasToken={}, valid={}", path, jwt != null, jwt != null && tokenProvider.isTokenValid(jwt));
        }
        if (jwt != null && tokenProvider.isTokenValid(jwt)) {
            try {
                Claims claims = tokenProvider.parseToken(jwt);
                String email = claims.getSubject();
                log.debug("JwtAuthFilter - token subject (email): {}", email);

                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    String role = user.getRole();
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(email, null, List.of(authority));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    if (path != null && path.startsWith("/api/users")) {
                        log.debug("JwtAuthFilter - auth set for email={}, userId={}", email, user.getId());
                    }
                } else {
                    if (path != null && path.startsWith("/api/users")) {
                        log.warn("JwtAuthFilter - token valid but user not in DB: email={}", email);
                    }
                }
            } catch (Exception e) {
                log.error("JwtAuthFilter - error parsing/setting auth: {}", e.getMessage(), e);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

