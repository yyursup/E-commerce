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
public class TopProductSalesDTO {
    private UUID productId;
    private String productName;
    private String conditionGrade;
    private String conditionGradeLabel;
    private BigDecimal price;
    private Long soldQuantity;
    private BigDecimal revenue;
    private Integer remainingStock;
    private String imageUrl;
}
