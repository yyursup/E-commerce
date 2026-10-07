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
public class CategorySpendingDTO {
    private UUID categoryId;
    private String categoryName;
    private BigDecimal amountSpent;
    private Long itemCount;
    private Double percentage;
}
