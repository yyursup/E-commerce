package com.marketplace.ecommerce.chatbot.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.support.ExecutorChannelInterceptor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Restores SecurityContext in the same thread as the message handler (beforeHandle),
 * so @PreAuthorize and SecurityContextHolder work in @MessageMapping handlers.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class WebSocketSecurityContextChannelInterceptor implements ExecutorChannelInterceptor {

    private final WebSocketSecurityContextStore securityContextStore;

    public WebSocketSecurityContextChannelInterceptor(WebSocketSecurityContextStore securityContextStore) {
        this.securityContextStore = securityContextStore;
    }

    @Override
    public Message<?> beforeHandle(Message<?> message, MessageChannel channel, MessageHandler handler) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(message);
        if (accessor.getUser() != null) {
            String sessionId = accessor.getUser().getName();
            SecurityContext context = securityContextStore.get(sessionId);
            if (context != null) {
                SecurityContextHolder.setContext(context);
            }
        }
        return message;
    }

    @Override
    public void afterMessageHandled(Message<?> message, MessageChannel channel, MessageHandler handler, Exception ex) {
        SecurityContextHolder.clearContext();
    }
}
