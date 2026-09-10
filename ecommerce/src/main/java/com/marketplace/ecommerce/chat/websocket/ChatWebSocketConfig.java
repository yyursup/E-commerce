package com.marketplace.ecommerce.chat.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.Arrays;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class ChatWebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    @Value("${app.websocket.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = allowedOrigins == null || allowedOrigins.isBlank()
                ? new String[] { "*" }
                : Arrays.stream(allowedOrigins.split("\\s*,\\s*")).filter(s -> !s.isBlank()).toArray(String[]::new);

        registry.addHandler(chatWebSocketHandler, "/ws/chat", "/api/v1/ws/chat")
                .setAllowedOriginPatterns(origins.length > 0 ? origins : new String[] { "*" });
    }
}
