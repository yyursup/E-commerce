package com.marketplace.ecommerce.chatbot.config;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSecurityContextStore {

    private final Map<String, SecurityContext> contexts =
            new ConcurrentHashMap<>();

    public void put(String accountId, SecurityContext context) {
        if (accountId != null && context != null) {
            contexts.put(accountId, context);
        }
    }

    public SecurityContext get(String accountId) {
        return accountId == null
                ? null
                : contexts.get(accountId);
    }

    public void remove(String accountId) {
        if (accountId != null) {
            contexts.remove(accountId);
        }
    }
}