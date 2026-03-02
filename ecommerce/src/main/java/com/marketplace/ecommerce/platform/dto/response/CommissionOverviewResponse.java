package com.marketplace.ecommerce.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class CommissionOverviewResponse {

    private BigDecimal totalCommission;
    private Long totalOrders;
    private BigDecimal averageCommissionRate;

    public static CommissionOverviewResponse from(
            BigDecimal totalCommission,
            Long totalOrders,
            BigDecimal averageCommissionRate
    ) {
        return CommissionOverviewResponse.builder()
                .totalCommission(totalCommission)
                .totalOrders(totalOrders)
                .averageCommissionRate(averageCommissionRate)
                .build();
    }
}
