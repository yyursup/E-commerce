package com.marketplace.ecommerce.chatbot.service;

import com.marketplace.ecommerce.chatbot.dto.request.AiChatRequest;
import com.marketplace.ecommerce.chatbot.dto.response.AiChatResponse;
import com.marketplace.ecommerce.common.CurrentUserInfo;

public interface AiChatService {
    AiChatResponse chat(AiChatRequest request, CurrentUserInfo principal);
}
