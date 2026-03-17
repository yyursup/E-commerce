package com.marketplace.ecommerce.chatbot.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.security.Principal;
import java.util.Arrays;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.websocket.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    private final WebSocketSecurityContextStore securityContextStore;
    private final WebSocketSecurityContextChannelInterceptor securityContextChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] patterns = allowedOrigins == null || allowedOrigins.isBlank()
                ? new String[] { "http://localhost:5173", "http://127.0.0.1:5173" }
                : Arrays.stream(allowedOrigins.split("\\s*,\\s*")).filter(s -> !s.isBlank()).toArray(String[]::new);
        registry.addEndpoint("/api/v1/ws-chat")
                .setAllowedOriginPatterns(patterns.length > 0 ? patterns : new String[] { "http://localhost:5173" })
                .addInterceptors(new HttpSessionHandshakeInterceptor(), new ChatSessionHandshakeInterceptor(securityContextStore))
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler handler, Map<String, Object> attributes) {
                        Object sessionId = attributes.get("CHAT_SESSION_ID");
                        if (sessionId != null) return new WebSocketPrincipal(sessionId.toString());
                        Object session = attributes.get("HTTP.SESSION");
                        if (session instanceof jakarta.servlet.http.HttpSession) {
                            return new WebSocketPrincipal(((jakarta.servlet.http.HttpSession) session).getId());
                        }
                        return new WebSocketPrincipal("anonymous-" + System.currentTimeMillis());
                    }
                })
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.setApplicationDestinationPrefixes("/app");
        config.enableSimpleBroker("/topic", "/queue", "/user");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(securityContextChannelInterceptor);
    }
}
