package com.marketplace.ecommerce.config;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
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

    private final List<String> publicEndpoints = List.of(
            "/static/**",
            "/api/v1/auth/login",
            "/api/v1/**"
    );

    public JwtFilter(
            TokenService tokenService,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver
    ) {
        this.tokenService = tokenService;
        this.resolver = resolver;
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
        boolean isPublic = isPublicAPI(uri);

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractJwtFromRequest(request);

        if (token == null) {
            if (isPublic) {
                filterChain.doFilter(request, response);
            } else {
                resolver.resolveException(request, response, null,
                        new RuntimeException("Missing Authorization Bearer token"));
            }
            return;
        }

        try {
            Account account = tokenService.getAccountFromToken(token);

            CurrentUserInfo info = new CurrentUserInfo();
            info.setId(account.getId());
            info.setUsername(account.getUsername());
            info.setRole(account.getRole().getRoleName());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            info, // <= inject vào @CurrentUser
                            null, // NEVER put token here
                            account.getAuthorities()
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException ex) {
            if (isPublic) {
                filterChain.doFilter(request, response);
            } else {
                resolver.resolveException(request, response, null,
                        new RuntimeException("Token expired"));
            }

        } catch (Exception ex) {
            if (isPublic) {
                filterChain.doFilter(request, response);
            } else {
                resolver.resolveException(request, response, null,
                        new RuntimeException("Invalid token"));
            }
        }
    }

}
