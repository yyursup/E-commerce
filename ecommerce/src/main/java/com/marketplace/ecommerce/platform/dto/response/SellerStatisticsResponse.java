package com.marketplace.ecommerce.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerStatisticsResponse {
    private String shopName;
    private BigDecimal totalRevenue;
    private BigDecimal estimatedRevenue;
    private Long totalOrders;
    private BigDecimal totalCommission;
    private BigDecimal totalNetIncome;
    private Map<String, Long> orderCountByStatus;
}
