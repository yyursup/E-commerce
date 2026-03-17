package com.marketplace.ecommerce.chatbot.controller;

import com.marketplace.ecommerce.chatbot.dto.request.ChatbotInteractRequest;
import com.marketplace.ecommerce.chatbot.dto.response.ChatbotResponse;
import com.marketplace.ecommerce.chatbot.service.ChatbotService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    /**
     * Initialize chatbot state (or return current). Called by frontend on widget load.
     */
    @GetMapping("/init")
    public ResponseEntity<ChatbotResponse> init(HttpSession session, @CurrentUser CurrentUserInfo principal) {
        ChatbotResponse dto = chatbotService.init(session, principal);
        return ResponseEntity.ok(dto);
    }

    /**
     * Handle button action or text input. Body: { "action": "..." } or { "text": "..." } or { "action": "SEARCH_CATEGORY", "categoryId": "uuid" }.
     */
    @PostMapping("/interact")
    public ResponseEntity<ChatbotResponse> interact(
            HttpSession session,
            @RequestBody ChatbotInteractRequest request,
            @CurrentUser CurrentUserInfo principal
    ) {
        ChatbotResponse dto = chatbotService.interact(session, request, principal);
        return ResponseEntity.ok(dto);
    }
}
