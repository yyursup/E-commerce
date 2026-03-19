package com.marketplace.ecommerce.chatbot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponse {
    private String messageText;
    private List<ChatbotOptionResponse> options;
    private List<ChatbotProductCardResponse> productCards;
    private boolean humanHandoffRequired;
    /** When humanHandoffRequired is true, client should use this to subscribe for replies: /user/{liveChatSessionId}/queue/chat */
    private String liveChatSessionId;
    private boolean inputExpected;
    private String inputHint;
}
