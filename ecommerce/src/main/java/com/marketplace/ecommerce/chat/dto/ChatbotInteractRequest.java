package com.marketplace.ecommerce.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotInteractRequest {
    private String action;
    private String text;
    private String currentNodeId;
    /** For SEARCH: categoryId when user selected a category. */
    private String categoryId;
}
