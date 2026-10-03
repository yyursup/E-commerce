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
public class LowStockAlertDTO {
    private UUID productId;
    private String productName;
    private String sku;
    private String conditionGrade;
    private String conditionGradeLabel;
    private Integer remainingStock;
    private BigDecimal basePrice;
    private String imageUrl;
}
