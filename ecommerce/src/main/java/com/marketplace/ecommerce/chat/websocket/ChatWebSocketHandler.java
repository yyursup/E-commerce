package com.marketplace.ecommerce.chat.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.chat.dto.SendMessageRequest;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final String ACCOUNT_ID_ATTR = "ACCOUNT_ID";
    private static final String USERNAME_ATTR = "USERNAME";
    private static final String ROLE_ATTR = "ROLE";

    private final TokenService tokenService;
    private final ObjectMapper objectMapper;
    private final ChatService chatService;
    private final WebSocketSessionService sessionService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            String query = session.getUri() != null ? session.getUri().getQuery() : null;
            String token = UriComponentsBuilder.fromUriString("?" + (query != null ? query : ""))
                    .build()
                    .getQueryParams()
                    .getFirst("token");

            if (token == null || token.isBlank()) {
                log.warn("Chat WebSocket rejected: missing token");
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            Account account = tokenService.getAccountFromToken(token);
            if (account == null) {
                log.warn("Chat WebSocket rejected: invalid token");
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            UUID accountId = account.getId();
            String roleName = account.getRole() != null ? account.getRole().getRoleName() : "CUSTOMER";

            session.getAttributes().put(ACCOUNT_ID_ATTR, accountId);
            session.getAttributes().put(USERNAME_ATTR, account.getUsername());
            session.getAttributes().put(ROLE_ATTR, roleName);

            WebSocketSession concurrentSession = new ConcurrentWebSocketSessionDecorator(session, 10000, 64 * 1024);
            sessionService.registerSession(accountId, roleName, concurrentSession);
            log.info("Chat WebSocket connected for user {} ({})", account.getUsername(), roleName);

        } catch (Exception e) {
            log.error("Chat WebSocket connection failed", e);
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID accountId = (UUID) session.getAttributes().get(ACCOUNT_ID_ATTR);
        String username = (String) session.getAttributes().get(USERNAME_ATTR);
        String role = (String) session.getAttributes().get(ROLE_ATTR);

        if (accountId == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        CurrentUserInfo userInfo = new CurrentUserInfo();
        userInfo.setAccountId(accountId);
        userInfo.setUsername(username);
        userInfo.setRole(role);

        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String event = root.path("event").asText(null);

            if ("CHAT_SEND".equalsIgnoreCase(event)) {
                JsonNode data = root.path("data");
                SendMessageRequest request = objectMapper.treeToValue(data, SendMessageRequest.class);
                chatService.sendMessage(userInfo, request);
                return;
            }

            if ("CHAT_READ".equalsIgnoreCase(event)) {
                String threadIdStr = root.path("data").path("threadId").asText(null);
                if (threadIdStr != null) {
                    chatService.markRead(userInfo, UUID.fromString(threadIdStr));
                }
                return;
            }

            if ("CHAT_TYPING".equalsIgnoreCase(event)) {
                String threadIdStr = root.path("data").path("threadId").asText(null);
                boolean isTyping = root.path("data").path("isTyping").asBoolean(true);
                String recipientIdStr = root.path("data").path("recipientId").asText(null);

                Object payload = new Object() {
                    public final String threadId = threadIdStr;
                    public final String senderName = username;
                    public final boolean typing = isTyping;
                };

                if (recipientIdStr != null && !recipientIdStr.isBlank()) {
                    sessionService.sendToUser(UUID.fromString(recipientIdStr), "CHAT_TYPING", payload);
                } else if (!"ADMIN".equalsIgnoreCase(role)) {
                    sessionService.broadcastToAdmins("CHAT_TYPING", payload);
                }
                return;
            }

            log.warn("Unsupported chat event: {}", event);

        } catch (Exception e) {
            log.error("Error processing chat message from {}", username, e);
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(new Object() {
                public final String event = "ERROR";
                public final String message = e.getMessage();
            })));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UUID accountId = (UUID) session.getAttributes().get(ACCOUNT_ID_ATTR);
        if (accountId != null) {
            sessionService.removeSession(accountId, session);
        }
    }
}
