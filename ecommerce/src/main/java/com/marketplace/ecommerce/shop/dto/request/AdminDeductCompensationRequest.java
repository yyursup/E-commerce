package com.marketplace.ecommerce.shop.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class AdminDeductCompensationRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private UUID orderId;

    private UUID reportId;

    @NotNull(message = "Số tiền trích bồi thường không được để trống")
    @DecimalMin(value = "1000", message = "Số tiền trích tối thiểu là 1.000 VNĐ")
    private BigDecimal amount;

    @NotBlank(message = "Lý do trích bồi thường không được để trống")
    private String reason;

    @NotBlank(message = "Mã yêu cầu (clientRequestId) không được để trống")
    private String clientRequestId;
}
