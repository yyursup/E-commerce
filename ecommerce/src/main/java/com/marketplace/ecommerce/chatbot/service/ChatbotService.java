package com.marketplace.ecommerce.chatbot.service;

import com.marketplace.ecommerce.chatbot.dto.response.ChatbotResponse;
import com.marketplace.ecommerce.chatbot.dto.request.ChatbotInteractRequest;
import com.marketplace.ecommerce.common.CurrentUserInfo;

import jakarta.servlet.http.HttpSession;

public interface ChatbotService {

    /**
     * Initialize or return current state. Sets session chatbotCurrentNode and chatbotRootNode.
     */
    ChatbotResponse init(HttpSession session, CurrentUserInfo principal);

    /**
     * Handle button action or text input. Updates session state and returns next message/options.
     */
    ChatbotResponse interact(HttpSession session, ChatbotInteractRequest request, CurrentUserInfo principal);
}
