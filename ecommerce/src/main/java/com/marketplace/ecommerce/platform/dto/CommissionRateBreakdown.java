package com.marketplace.ecommerce.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionRateBreakdown {
    private BigDecimal baseRate;
    private BigDecimal depositDiscount;
    private BigDecimal seniorityDiscount;
    private BigDecimal floorRate;
    private BigDecimal finalRate;
    private String categoryName;
    private BigDecimal depositAmount;
    private long activeMonths;
    private int violationCount;
    private String formulaExplanation;
}
