package com.marketplace.ecommerce.statistics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchasedDeviceDTO {
    private UUID orderId;
    private String orderNumber;
    private UUID productId;
    private String productName;
    private String conditionGrade;
    private String conditionGradeLabel;
    private String warrantyType;
    private String warrantyTypeLabel;
    private BigDecimal purchasePrice;
    private LocalDateTime purchaseDate;
    private String warrantyStatus; // ACTIVE, EXPIRED, NOT_APPLICABLE
    private String imageUrl;
}
