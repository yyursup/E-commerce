package com.marketplace.ecommerce.chatbot.controller;

import com.marketplace.ecommerce.chatbot.constant.LiveChatConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * STOMP message handlers for live chat: user sends to /app/chat, admin sends reply to /app/chat/reply.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class LiveChatController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * User (after handoff) sends a message. Broadcast to admin topic with sessionId and content.
     */
    @MessageMapping("/chat")
    public void chat(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor accessor) {
        String sessionId = accessor.getUser() != null ? accessor.getUser().getName() : "unknown";
        String text = payload != null && payload.get("text") != null ? payload.get("text").toString() : "";
        messagingTemplate.convertAndSend(LiveChatConstants.TOPIC_ADMIN_LIVE_CHAT, (Object) Map.<String, Object>of(
                "sessionId", sessionId,
                "text", text,
                "from", "Khách",
                "fromUser", false
        ));
        log.debug("Live chat message from session {}: {}", sessionId, text);
    }

    /**
     * Admin sends reply to a specific session. Payload: { "sessionId": "...", "text": "..." }.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @MessageMapping("/chat/reply")
    public void reply(@Payload Map<String, Object> payload) {
        String sessionId = payload != null && payload.get("sessionId") != null ? payload.get("sessionId").toString() : null;
        String text = payload != null && payload.get("text") != null ? payload.get("text").toString() : "";
        if (sessionId == null || sessionId.isBlank()) return;
        String replyTopic = LiveChatConstants.TOPIC_LIVE_CHAT_REPLY_PREFIX + sessionId;
        messagingTemplate.convertAndSend(replyTopic, (Object) Map.of("text", text, "fromAdmin", true));
        log.debug("Admin reply to session {}: {}", sessionId, text);
    }
}
