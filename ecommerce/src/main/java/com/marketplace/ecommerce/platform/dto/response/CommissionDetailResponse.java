package com.marketplace.ecommerce.platform.dto.response;

import com.marketplace.ecommerce.platform.entity.Commission;
import com.marketplace.ecommerce.platform.entity.CommissionItem;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class CommissionDetailResponse {

    private UUID orderId;
    private String sellerName;
    private BigDecimal orderAmount;
    private BigDecimal totalCommission;
    private List<CommissionItemResponse> items;
    private LocalDateTime createdAt;

    public static CommissionDetailResponse from(Commission commission, String sellerName) {
        return CommissionDetailResponse.builder()
                .orderId(commission.getOrderId())
                .sellerName(sellerName)
                .orderAmount(commission.getOrderAmount())
                .totalCommission(commission.getTotalCommission())
                .items(
                        commission.getItems() == null
                                ? List.of()
                                : commission.getItems().stream()
                                .map(CommissionItemResponse::from)
                                .toList()
                )
                .createdAt(commission.getCreatedAt())
                .build();
    }
}
