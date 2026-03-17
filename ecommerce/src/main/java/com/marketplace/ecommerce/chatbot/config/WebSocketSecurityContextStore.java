package com.marketplace.ecommerce.chatbot.config;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stores SecurityContext by HTTP session ID at WebSocket handshake so it can be
 * restored when handling STOMP messages (where SecurityContextHolder is not set).
 */
@Component
public class WebSocketSecurityContextStore {

    private final Map<String, SecurityContext> bySessionId = new ConcurrentHashMap<>();

    public void put(String httpSessionId, SecurityContext context) {
        if (httpSessionId != null && context != null) {
            bySessionId.put(httpSessionId, context);
        }
    }

    public SecurityContext get(String httpSessionId) {
        return httpSessionId != null ? bySessionId.get(httpSessionId) : null;
    }

    public void remove(String httpSessionId) {
        if (httpSessionId != null) {
            bySessionId.remove(httpSessionId);
        }
    }
}
