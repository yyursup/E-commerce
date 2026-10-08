package com.marketplace.ecommerce.live.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateLiveStreamRequest {
    @NotBlank(message = "Tiêu đề livestream không được để trống")
    private String title;

    private String coverImageUrl;

    private List<LiveProductItemRequest> products;

    @Data
    public static class LiveProductItemRequest {
        private UUID productId;
        private BigDecimal livePrice;
    }
}
