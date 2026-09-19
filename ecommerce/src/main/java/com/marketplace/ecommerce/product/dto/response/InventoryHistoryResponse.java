package com.marketplace.ecommerce.product.dto.response;

import com.marketplace.ecommerce.product.entity.InventoryHistory;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InventoryHistoryResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID variantId;
    private String variantName;
    private Integer oldStock;
    private Integer newStock;
    private Integer changeAmount;
    private InventoryActionType actionType;
    private String referenceId;
    private String note;
    private LocalDateTime createdAt;

    public static InventoryHistoryResponse from(InventoryHistory history) {
        String variantStr = null;
        if (history.getProductVariant() != null) {
            String color = history.getProductVariant().getColor() != null ? history.getProductVariant().getColor() : "";
            String size = history.getProductVariant().getSize() != null ? history.getProductVariant().getSize() : "";
            variantStr = (color + " " + size).trim();
            if (variantStr.isEmpty()) {
                variantStr = "Phân loại mặc định";
            }
        }

        return InventoryHistoryResponse.builder()
                .id(history.getId())
                .productId(history.getProduct().getId())
                .productName(history.getProduct().getName())
                .variantId(history.getProductVariant() != null ? history.getProductVariant().getId() : null)
                .variantName(variantStr)
                .oldStock(history.getOldStock())
                .newStock(history.getNewStock())
                .changeAmount(history.getChangeAmount())
                .actionType(history.getActionType())
                .referenceId(history.getReferenceId())
                .note(history.getNote())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
