package com.marketplace.ecommerce.chat.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketSessionService {

    private final ObjectMapper objectMapper;

    @jakarta.annotation.PostConstruct
    public void init() {
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.findAndRegisterModules();
    }

    // Account ID -> Active WebSocket Sessions
    private final Map<UUID, CopyOnWriteArrayList<WebSocketSession>> sessions = new ConcurrentHashMap<>();

    // Account ID -> Role Name
    private final Map<UUID, String> accountRoles = new ConcurrentHashMap<>();

    public void registerSession(UUID accountId, String role, WebSocketSession session) {
        sessions.computeIfAbsent(accountId, k -> new CopyOnWriteArrayList<>()).add(session);
        if (role != null) {
            accountRoles.put(accountId, role);
        }
        log.info("Registered WebSocket session for Account [{}] (Role: {}). Active sessions: {}",
                accountId, role, sessions.get(accountId).size());
    }

    public void removeSession(UUID accountId, WebSocketSession session) {
        CopyOnWriteArrayList<WebSocketSession> userSessions = sessions.get(accountId);
        if (userSessions != null) {
            userSessions.removeIf(s -> s.getId().equals(session.getId()));
            if (userSessions.isEmpty()) {
                sessions.remove(accountId);
                accountRoles.remove(accountId);
            }
            log.info("Removed WebSocket session for Account [{}].", accountId);
        }
    }

    public void sendToUser(UUID accountId, String event, Object data) {
        if (accountId == null) return;
        CopyOnWriteArrayList<WebSocketSession> userSessions = sessions.get(accountId);
        if (userSessions == null || userSessions.isEmpty()) {
            log.warn("Cannot send WebSocket [{}] to Account [{}] - user has no active WebSocket session", event, accountId);
            return;
        }

        try {
            WebSocketMessage message = WebSocketMessage.builder()
                    .event(event)
                    .data(data)
                    .build();
            String jsonPayload = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(jsonPayload);

            int sentCount = 0;
            for (WebSocketSession session : userSessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                        sentCount++;
                    } catch (Exception e) {
                        log.error("Failed to send WebSocket message to session [{}] of Account [{}]: {}",
                                session.getId(), accountId, e.getMessage(), e);
                    }
                }
            }
            log.info("Dispatched WebSocket event [{}] to Account [{}] ({} active session(s) reached)",
                    event, accountId, sentCount);
        } catch (Exception e) {
            log.error("Error serializing WebSocket message for Account [{}]", accountId, e);
        }
    }

    public void broadcastToAdmins(String event, Object data) {
        int adminCount = 0;
        for (Map.Entry<UUID, String> entry : accountRoles.entrySet()) {
            String role = entry.getValue();
            if ("ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role)) {
                sendToUser(entry.getKey(), event, data);
                adminCount++;
            }
        }
        log.info("Broadcasted WebSocket event [{}] to {} admin(s)", event, adminCount);
    }

    public boolean isOnline(UUID accountId) {
        CopyOnWriteArrayList<WebSocketSession> userSessions = sessions.get(accountId);
        return userSessions != null && !userSessions.isEmpty();
    }

    @Data
    @Builder
    public static class WebSocketMessage {
        private String event;
        private Object data;
    }
}
