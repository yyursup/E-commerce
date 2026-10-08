package com.marketplace.ecommerce.platform.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class SeniorityPolicyRequest {

    @NotNull(message = "Số tháng tối thiểu không được để trống")
    @Min(value = 1, message = "Số tháng tối thiểu phải từ 1 tháng trở lên")
    private Integer minMonths;

    @NotNull(message = "Mức giảm trừ không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Mức giảm trừ tối thiểu là 0%")
    @DecimalMax(value = "10.0", inclusive = true, message = "Mức giảm trừ tối đa là 10%")
    private BigDecimal discountRate;

    @NotBlank(message = "Tên mốc thâm niên không được để trống")
    private String tierName;

    private String description;

    private Boolean isActive;
}
