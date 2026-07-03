package com.marketplace.ecommerce.chatbot.controller;

import com.marketplace.ecommerce.chatbot.dto.request.ChatbotInteractRequest;
import com.marketplace.ecommerce.chatbot.dto.response.ChatbotResponse;
import com.marketplace.ecommerce.chatbot.service.ChatbotService;
import com.marketplace.ecommerce.chatbot.service.GeminiService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final GeminiService geminiService;

    /**
     * Initialize chatbot state (or return current). Called by frontend on widget
     * load.
     */
    @GetMapping("/init")
    public ResponseEntity<ChatbotResponse> init(HttpSession session, @CurrentUser CurrentUserInfo principal) {
        ChatbotResponse dto = chatbotService.init(session, principal);
        return ResponseEntity.ok(dto);
    }

    /**
     * Handle button action or text input. Body: { "action": "..." } or { "text":
     * "..." } or { "action": "SEARCH_CATEGORY", "categoryId": "uuid" }.
     */
    @PostMapping("/interact")
    public ResponseEntity<ChatbotResponse> interact(
            HttpSession session,
            @RequestBody ChatbotInteractRequest request,
            @CurrentUser CurrentUserInfo principal) {
        ChatbotResponse dto = chatbotService.interact(session, request, principal);
        return ResponseEntity.ok(dto);
    }

    /**
     * Stream response from AI chatbot (Gemini) using Server-Sent Events.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @SuppressWarnings("unchecked")
    public SseEmitter streamChat(@RequestParam String text, HttpSession session,
            @CurrentUser CurrentUserInfo principal) {
        session.setAttribute("chatbotCurrentNode", "NODE_AI_CHAT");

        List<Map<String, Object>> history = (List<Map<String, Object>>) session.getAttribute("chatbotHistory");
        if (history == null) {
            history = new ArrayList<>();
        }

        String context = chatbotService.prepareAiChatContext(session, text, principal);
        String fullPrompt = text;
        if (context != null && !context.isBlank()) {
            fullPrompt = context + "\n\nCâu hỏi của khách hàng: " + text;
        }

        List<Map<String, Object>> contents = new ArrayList<>(history);
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", fullPrompt))));

        // Lưu câu hỏi gốc của user vào lịch sử session ngay lập tức
        history.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", text))));
        session.setAttribute("chatbotHistory", history);

        SseEmitter emitter = new SseEmitter(60000L); // 60s timeout
        geminiService.streamResponse(contents, history, session, emitter);
        return emitter;
    }
}
