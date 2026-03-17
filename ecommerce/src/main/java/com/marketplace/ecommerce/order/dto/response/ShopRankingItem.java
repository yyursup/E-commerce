package com.marketplace.ecommerce.order.dto.response;

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
public class ShopRankingItem {
    private int rank;
    private UUID shopId;
    private String shopName;
    private BigDecimal totalRevenue;
    private long orderCount;
}
