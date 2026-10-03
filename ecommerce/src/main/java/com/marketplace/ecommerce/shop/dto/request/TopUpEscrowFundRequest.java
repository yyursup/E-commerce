package com.marketplace.ecommerce.shop.dto.request;

import jakarta.validation.constraints.DecimalMin;
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
public class TopUpEscrowFundRequest {

    @NotNull(message = "Số tiền nạp không được để trống")
    @DecimalMin(value = "10000", message = "Số tiền nạp tối thiểu là 10.000 VNĐ")
    private BigDecimal amount;

    private String paymentMethod; // VNPAY, WALLET, BANK_TRANSFER

    private String referenceCode;

    private String note;
}
