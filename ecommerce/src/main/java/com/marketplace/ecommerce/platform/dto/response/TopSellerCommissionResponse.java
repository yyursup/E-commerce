package com.marketplace.ecommerce.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class TopSellerCommissionResponse {

    private UUID sellerId;
    private String shopName;
    private BigDecimal totalCommission;

    public static TopSellerCommissionResponse from(UUID sellerId, String shopName, BigDecimal totalCommission) {
        return TopSellerCommissionResponse.builder()
                .sellerId(sellerId)
                .shopName(shopName)
                .totalCommission(totalCommission)
                .build();
    }
}
