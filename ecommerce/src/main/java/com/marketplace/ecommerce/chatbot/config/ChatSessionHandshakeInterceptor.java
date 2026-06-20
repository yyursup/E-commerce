package com.marketplace.ecommerce.chatbot.config;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class ChatSessionHandshakeInterceptor
        implements HandshakeInterceptor {

    public static final String ACCOUNT_ID = "ACCOUNT_ID";
    public static final String USERNAME = "USERNAME";

    private static final String SPRING_SECURITY_CONTEXT_KEY =
            "SPRING_SECURITY_CONTEXT";

    private final WebSocketSecurityContextStore securityContextStore;

    public ChatSessionHandshakeInterceptor(
            WebSocketSecurityContextStore securityContextStore) {
        this.securityContextStore = securityContextStore;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        if (request instanceof ServletServerHttpRequest servletRequest) {

            var session =
                    servletRequest.getServletRequest().getSession(true);

            Object ctx =
                    session.getAttribute(SPRING_SECURITY_CONTEXT_KEY);

            if (ctx instanceof SecurityContext securityContext
                    && securityContext.getAuthentication() != null
                    && securityContext.getAuthentication().getPrincipal()
                    instanceof CurrentUserInfo user) {

                String accountId =
                        String.valueOf(user.getAccountId());

                attributes.put(ACCOUNT_ID, accountId);
                attributes.put(USERNAME, user.getUsername());

                securityContextStore.put(
                        accountId,
                        securityContext
                );
            }
        }

        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
    }
}