package com.marketplace.ecommerce.chatbot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotProductCardResponse {
    private UUID id;
    private String name;
    private BigDecimal basePrice;
    private String productUrl;
    private String thumbnailUrl;
}
