package com.marketplace.ecommerce.platform.dto.response;

import com.marketplace.ecommerce.platform.entity.CommissionItem;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CommissionItemResponse {

    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;

    public static CommissionItemResponse from(CommissionItem item) {
        return CommissionItemResponse.builder()
                .productName(item.getProductName())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .commissionRate(item.getCommissionRate())
                .commissionAmount(item.getCommissionAmount())
                .build();
    }
}
