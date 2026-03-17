package com.marketplace.ecommerce.chatbot.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Puts HTTP session ID into handshake attributes and stores SecurityContext
 * so STOMP handlers can run with authentication (e.g. @PreAuthorize).
 */
public class ChatSessionHandshakeInterceptor implements HandshakeInterceptor {

    public static final String CHAT_SESSION_ID = "CHAT_SESSION_ID";
    private static final String SPRING_SECURITY_CONTEXT_KEY = "SPRING_SECURITY_CONTEXT";

    private final WebSocketSecurityContextStore securityContextStore;

    public ChatSessionHandshakeInterceptor(WebSocketSecurityContextStore securityContextStore) {
        this.securityContextStore = securityContextStore;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest) {
            jakarta.servlet.http.HttpSession session = ((ServletServerHttpRequest) request).getServletRequest().getSession(true);
            attributes.put(CHAT_SESSION_ID, session.getId());
            Object ctx = session.getAttribute(SPRING_SECURITY_CONTEXT_KEY);
            if (ctx instanceof SecurityContext) {
                securityContextStore.put(session.getId(), (SecurityContext) ctx);
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception exception) {
    }
}
