package com.marketplace.ecommerce.chatbot.config;

import java.security.Principal;

public record WebSocketPrincipal(String accountId, String username) implements Principal {

    @Override
    public String getName() {
        return accountId;
    }
}