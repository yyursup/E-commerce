package com.marketplace.ecommerce.statistics.dto.response;

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
public class TopShopAnalyticsDTO {
    private UUID shopId;
    private String shopName;
    private Boolean isKycVerified;
    private BigDecimal totalRevenue;
    private Long orderCount;
    private BigDecimal commissionContributed;
    private Double fulfillmentRate;
}
