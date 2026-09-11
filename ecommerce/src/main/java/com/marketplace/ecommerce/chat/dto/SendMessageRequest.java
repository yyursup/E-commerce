package com.marketplace.ecommerce.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    private UUID threadId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String content;

    private UUID recipientId;
}
