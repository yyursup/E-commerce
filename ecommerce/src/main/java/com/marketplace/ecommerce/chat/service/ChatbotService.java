package com.marketplace.ecommerce.chat.service;

import com.marketplace.ecommerce.chat.dto.ChatbotInteractRequest;
import com.marketplace.ecommerce.chat.dto.ChatbotResponse;
import com.marketplace.ecommerce.common.CurrentUserInfo;

public interface ChatbotService {

    /**
     * Initialize chatbot state (returns root node and initial recommendation cards).
     */
    ChatbotResponse init(CurrentUserInfo principal);

    /**
     * Handle button action or text input statelessly.
     */
    ChatbotResponse interact(ChatbotInteractRequest request, CurrentUserInfo principal);
}
