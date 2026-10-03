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
public class TopCategoryAnalyticsDTO {
    private UUID categoryId;
    private String categoryName;
    private Long productCount;
    private Long orderItemsSold;
    private BigDecimal totalRevenue;
    private Double revenueShare;
}
