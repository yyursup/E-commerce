package com.marketplace.ecommerce.config;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.InvalidCredentialsException;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final HandlerExceptionResolver resolver;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    /**
     * Public endpoints that don't require authentication.
     * These match the SecurityConfig permitAll() rules.
     * 
     * IMPORTANT: Keep this in sync with SecurityConfig.java!
     */
    private final List<String> publicEndpoints = List.of(
        // Error & Static
        "/error",
        "/favicon.ico",
        "/static/**",
        "/uploads/**",
        
        // Authentication
        "/api/v1/auth/login",
        "/api/v1/auth/refresh-token",
        "/api/v1/auth/register",
        "/api/v1/auth/verify",
        "/api/v1/auth/forgot-password/send-otp",
        "/api/v1/auth/forgot-password/reset",
        "/api/v1/auth/oauth2/**",
        
        // Products (public read)
        "/api/v1/product",
        "/api/v1/product/**",
        
        // Categories (public read)
        "/api/v1/category",
        "/api/v1/category/**",
        
        // Shops (public read)
        "/api/v1/shop",
        "/api/v1/shop/**",
        
        // Reviews (public read)
        "/api/v1/review/products/**",
        
        // Social (public read)
        "/api/v1/social/shop/follow-status/**",
        
        // Wishlist (public check)
        "/api/v1/wishlist/status/**",
        
        // Livestreams (public view)
        "/api/v1/livestreams/active",
        "/api/v1/livestreams",
        "/api/v1/livestreams/*",
        "/api/v1/livestreams/*/join",
        "/api/v1/livestreams/*/like",
        
        // Vouchers (public read)
        "/api/v1/vouchers",
        "/api/v1/vouchers/**",
        
        // Statistics (public read)
        "/api/v1/statistics/platform",
        
        // Third-party Webhooks
        "/payments/vnpay/callback",
        "/api/v1/webhook/ghn/**",
        
        // File reads
        "/api/v1/file/**",
        
        // Swagger / OpenAPI
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/swagger-ui.html",
        
        // Actuator
        "/actuator/health",
        "/actuator/info",
        
        // WebSocket (handled separately in SecurityConfig)
        "/api/v1/ws/chat",
        "/api/v1/ws/chat/**",
        "/api/v1/ws-chat",
        "/api/v1/ws-chat/**",
        "/ws/chat",
        "/ws/chat/**",
        
        // Chat API (permitted but JWT validated in filter)
        "/api/v1/chat/**"
    );

    public JwtFilter(
            TokenService tokenService,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver
    ) {
        this.tokenService = tokenService;
        this.resolver = resolver;
    }

    /**
     * Check if the request URI is a public endpoint.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return isPublicAPI(uri);
    }

    private boolean isPublicAPI(String uri) {
        return publicEndpoints.stream().anyMatch(pattern -> pathMatcher.match(pattern, uri));
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();
        
        // If public endpoint, skip JWT validation
        if (isPublicAPI(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Already authenticated, continue
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractJwtFromRequest(request);

        if (token == null) {
            resolver.resolveException(request, response, null,
                    new InvalidCredentialsException("Missing Authorization Bearer token"));
            return;
        }

        try {
            Account account = tokenService.getAccountFromToken(token);

            CurrentUserInfo info = new CurrentUserInfo();
            info.setAccountId(account.getId());
            info.setUsername(account.getUsername());
            info.setRole(account.getRole().getRoleName());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            info,
                            null,
                            account.getAuthorities()
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException ex) {
            resolver.resolveException(request, response, null,
                    new InvalidCredentialsException("Token expired"));
        } catch (Exception ex) {
            resolver.resolveException(request, response, null,
                    new InvalidCredentialsException("Invalid token"));
        }
    }
}
