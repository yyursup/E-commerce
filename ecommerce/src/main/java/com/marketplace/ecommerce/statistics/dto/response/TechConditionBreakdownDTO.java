package com.marketplace.ecommerce.statistics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechConditionBreakdownDTO {
    private String conditionGrade;
    private String label;
    private Long productCount;
    private Long soldQuantity;
    private BigDecimal totalRevenue;
    private Double percentage;
}
