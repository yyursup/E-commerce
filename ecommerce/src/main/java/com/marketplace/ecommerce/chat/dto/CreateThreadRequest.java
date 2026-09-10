package com.marketplace.ecommerce.chat.dto;

import com.marketplace.ecommerce.chat.enums.ThreadType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateThreadRequest {
    private ThreadType type;
    private UUID shopId;
    private String title;
    private String initialMessage;
}
