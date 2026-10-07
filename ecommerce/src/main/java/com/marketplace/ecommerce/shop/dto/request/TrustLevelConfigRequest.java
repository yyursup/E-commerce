package com.marketplace.ecommerce.shop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustLevelConfigRequest {

    @NotBlank(message = "Tên hạng không được để trống")
    private String tierName;

    @NotNull(message = "Ngưỡng tiền tối thiểu không được để trống")
    private BigDecimal minDeposit;

    private BigDecimal maxDeposit; // null for level 5

    private String badgeIconUrl;

    private String benefitsDescription;

    private BigDecimal commissionDiscount;

    private Boolean isActive;
}
