package com.marketplace.ecommerce.chatbot.config;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class WsChatTokenFilter extends OncePerRequestFilter {

    public static final String SPRING_SECURITY_CONTEXT_KEY = "SPRING_SECURITY_CONTEXT";

    private final TokenService tokenService;

    public WsChatTokenFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = request.getParameter("token");
        if (token != null && !token.isBlank()) {
            try {
                Account account = tokenService.getAccountFromToken(token);
                if (account != null && account.getRole() != null) {
                    CurrentUserInfo info = new CurrentUserInfo();
                    info.setAccountId(account.getId());
                    info.setUsername(account.getUsername());
                    info.setRole(account.getRole().getRoleName());
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(info, null, account.getAuthorities());
                    SecurityContext ctx = SecurityContextHolder.createEmptyContext();
                    ctx.setAuthentication(auth);
                    HttpSession session = request.getSession(true);
                    session.setAttribute(SPRING_SECURITY_CONTEXT_KEY, ctx);
                }
            } catch (Exception e) {
                log.debug("Invalid or expired token for ws-chat: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !uri.startsWith("/api/v1/ws-chat");
    }
}
