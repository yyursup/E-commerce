package com.marketplace.ecommerce.chatbot.controller;

import com.marketplace.ecommerce.chatbot.dto.request.AiChatRequest;
import com.marketplace.ecommerce.chatbot.dto.response.AiChatResponse;
import com.marketplace.ecommerce.chatbot.service.AiChatService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(version = "1", path = "/chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    /** Khách vãng lai dùng được (tư vấn sản phẩm); đã đăng nhập thì AI xem thêm được đơn hàng/voucher của chính mình. */
    @PostMapping("/ai")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request,
                                               @CurrentUser CurrentUserInfo principal) {
        return ResponseEntity.ok(aiChatService.chat(request, principal));
    }
}
