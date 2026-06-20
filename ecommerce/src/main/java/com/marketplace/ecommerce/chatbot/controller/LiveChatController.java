package com.marketplace.ecommerce.chatbot.controller;

import com.marketplace.ecommerce.chatbot.config.WebSocketPrincipal;
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

    @MessageMapping("/chat")
    public void chat(
            @Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor accessor) {

        WebSocketPrincipal principal =
                (WebSocketPrincipal) accessor.getUser();

        String accountId = principal.accountId();

        String userName = principal.username();

        String text =
                payload.getOrDefault("text", "").toString();

        String imageUrl =
                payload.getOrDefault("imageUrl", "").toString();

        messagingTemplate.convertAndSend(
                LiveChatConstants.TOPIC_ADMIN_LIVE_CHAT,
                (Object) Map.of(
                        "accountId", accountId,
                        "userName", userName,
                        "text", text,
                        "imageUrl", imageUrl,
                        "fromUser", true
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @MessageMapping("/chat/reply")
    public void reply(
            @Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor accessor) {

        String accountId =
                payload.get("sessionId") != null
                        ? payload.get("sessionId").toString()
                        : null;

        if (accountId == null || accountId.isBlank()) {
            log.warn("ACCOUNT_ID NULL");
            return;
        }

        String text =
                payload.get("text") != null
                        ? payload.get("text").toString()
                        : "";

        String imageUrl =
                payload.get("imageUrl") != null
                        ? payload.get("imageUrl").toString()
                        : "";

        String replyTopic =
                LiveChatConstants.TOPIC_LIVE_CHAT_REPLY_PREFIX + accountId;

        log.info("ADMIN REPLY TO ACCOUNT_ID = {}", accountId);

        messagingTemplate.convertAndSend(
                replyTopic,
                (Object) Map.of(
                        "accountId", accountId,
                        "text", text,
                        "imageUrl", imageUrl,
                        "fromAdmin", true
                )
        );

        log.info("MESSAGE SENT SUCCESS");
    }
}
