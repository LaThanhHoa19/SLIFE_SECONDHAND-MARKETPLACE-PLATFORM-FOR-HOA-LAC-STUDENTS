/**
 * Mục đích: Cấu hình AuthFilter.java
 * Endpoints liên quan: N/A
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.config;
import jakarta.servlet.*;import jakarta.servlet.http.*;import org.springframework.web.filter.OncePerRequestFilter;import java.io.IOException;
public class AuthFilter extends OncePerRequestFilter{ @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException, IOException { chain.doFilter(req,res);} }