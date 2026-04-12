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
import org.springframework.http.HttpMethod;
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
    private final TokenBlacklistService tokenBlacklistService;
    private final JwtUserSessionValidator sessionValidator;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   UserRepository userRepository,
                                   TokenBlacklistService tokenBlacklistService,
                                   JwtUserSessionValidator sessionValidator) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.tokenBlacklistService = tokenBlacklistService;
        this.sessionValidator = sessionValidator;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Tránh xử lý JWT trên CORS preflight — để CorsFilter trả 204/200 đúng header
        return HttpMethod.OPTIONS.matches(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String jwt = resolveToken(request);

        if (jwt != null && tokenProvider.isTokenValid(jwt) && !tokenBlacklistService.isBlacklisted(jwt)) {
            try {
                Claims claims = tokenProvider.parseToken(jwt);
                String email = claims.getSubject();

                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (!sessionValidator.isAccessAllowed(claims, user)) {
                        log.debug("JwtAuthFilter - session revoked or banned: email={}, path={}", email, request.getRequestURI());
                    } else {
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole());
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(email, null, List.of(authority));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        log.debug("JwtAuthFilter - authenticated: email={}, path={}", email, request.getRequestURI());
                    }
                }
            } catch (Exception e) {
                log.error("JwtAuthFilter - error: {}", e.getMessage(), e);
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