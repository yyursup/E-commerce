package com.marketplace.ecommerce.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class CommissionByCategoryResponse {

    private UUID categoryId;
    private String categoryName;
    private BigDecimal totalCommission;
}
