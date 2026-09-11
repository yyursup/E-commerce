package com.marketplace.ecommerce.chat.dto;

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
    private String currentNodeId;
    private String messageText;
    private List<ChatbotOptionResponse> options;
    private List<ChatbotProductCardResponse> productCards;
    private boolean humanHandoffRequired;
    private String liveChatSessionId;
    private boolean inputExpected;
    private String inputHint;
}
