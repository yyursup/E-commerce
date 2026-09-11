package com.marketplace.ecommerce.chat.controller;

import com.marketplace.ecommerce.chat.dto.ChatbotInteractRequest;
import com.marketplace.ecommerce.chat.dto.ChatbotResponse;
import com.marketplace.ecommerce.chat.service.ChatbotService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(version = "1", path = "/chat")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @GetMapping("/init")
    public ResponseEntity<ChatbotResponse> init(@CurrentUser CurrentUserInfo principal) {
        return ResponseEntity.ok(chatbotService.init(principal));
    }

    @PostMapping("/interact")
    public ResponseEntity<ChatbotResponse> interact(
            @RequestBody(required = false) ChatbotInteractRequest request,
            @CurrentUser CurrentUserInfo principal) {
        return ResponseEntity.ok(chatbotService.interact(request, principal));
    }
}
