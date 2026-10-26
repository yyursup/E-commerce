package com.marketplace.ecommerce.chatbot.dto.request;

import java.util.List;

/** Lịch sử hội thoại do client gửi lên (stateless). role: "user" | "model". */
public record AiChatRequest(List<Message> messages) {
    public record Message(String role, String text) {
    }
}
