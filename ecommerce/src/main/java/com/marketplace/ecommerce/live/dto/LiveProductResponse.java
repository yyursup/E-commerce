package com.marketplace.ecommerce.live.dto;

import com.marketplace.ecommerce.live.entity.LiveProduct;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class LiveProductResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productImageUrl;
    private BigDecimal originalPrice;
    private BigDecimal livePrice;
    private Integer stock;
    private Boolean isPinned;
    private Integer displayOrder;

    public static LiveProductResponse fromEntity(LiveProduct lp) {
        String imgUrl = null;
        if (lp.getProduct().getImages() != null && !lp.getProduct().getImages().isEmpty()) {
            imgUrl = lp.getProduct().getImages().iterator().next().getImageUrl();
        }
        return LiveProductResponse.builder()
                .id(lp.getId())
                .productId(lp.getProduct().getId())
                .productName(lp.getProduct().getName())
                .productImageUrl(imgUrl)
                .originalPrice(lp.getProduct().getBasePrice())
                .livePrice(lp.getLivePrice() != null ? lp.getLivePrice() : lp.getProduct().getBasePrice())
                .stock(lp.getProduct().getQuantity())
                .isPinned(Boolean.TRUE.equals(lp.getIsPinned()))
                .displayOrder(lp.getDisplayOrder())
                .build();
    }
}
