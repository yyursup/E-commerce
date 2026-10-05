package com.marketplace.ecommerce.shop.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAdjustEscrowFundRequest {

    @DecimalMin(value = "0", message = "Hạn mức cam kết ký quỹ không được âm")
    private BigDecimal committedAmount;

    @DecimalMin(value = "0", message = "Số dư quỹ ký quỹ không được âm")
    private BigDecimal balance;

    @Min(value = 1, message = "Cấp độ uy tín tối thiểu là 1 sao")
    @Max(value = 5, message = "Cấp độ uy tín tối đa là 5 sao")
    private Integer targetTrustLevel;

    @NotBlank(message = "Vui lòng nhập lý do điều chỉnh ký quỹ")
    private String reason;
}
