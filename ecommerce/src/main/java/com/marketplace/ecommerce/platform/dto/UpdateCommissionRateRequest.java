package com.marketplace.ecommerce.platform.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCommissionRateRequest {

    @DecimalMin(value = "0", message = "Tỷ lệ hoa hồng phải từ 0% trở lên.")
    @DecimalMax(value = "100", message = "Tỷ lệ hoa hồng không được vượt quá 100%.")
    private BigDecimal commissionRate;
}
