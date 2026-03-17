package com.marketplace.ecommerce.chatbot.config;

import java.security.Principal;

/**
 * Principal whose name is the HTTP session ID, so STOMP can target messages by session (including guests).
 */
public class WebSocketPrincipal implements Principal {
    private final String name;

    public WebSocketPrincipal(String name) {
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }
}
