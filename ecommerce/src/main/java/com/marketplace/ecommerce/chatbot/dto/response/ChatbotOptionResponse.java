package com.marketplace.ecommerce.chatbot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotOptionResponse {
    private String buttonLabel;
    private String actionPayload;
    private String nextNodeId;
    /** Optional: for SEARCH_CATEGORY, send this when user clicks the category button. */
    private String categoryId;
}
