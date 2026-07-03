package com.marketplace.ecommerce.chatbot.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

public interface GeminiService {
    /**
     * Generate response synchronously with full conversation history.
     * @param contents the full conversation history compatible with Gemini API
     * @return the AI response text
     */
    String generateResponse(List<Map<String, Object>> contents);

    /**
     * Stream response asynchronously via SseEmitter with full conversation history and automatically updates session history.
     * @param contents the contents payload sent to Gemini API
     * @param history the mutable list representing session chat history to update
     * @param session the http session to save the updated history list
     * @param emitter the SSE emitter to stream content
     */
    void streamResponse(List<Map<String, Object>> contents, List<Map<String, Object>> history, HttpSession session, SseEmitter emitter);
}
