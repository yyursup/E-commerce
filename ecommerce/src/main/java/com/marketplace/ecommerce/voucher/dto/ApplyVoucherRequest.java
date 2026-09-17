package com.marketplace.ecommerce.voucher.dto;

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
public class ApplyVoucherRequest {

    private String code;

    private String shopVoucherCode;

    private String platformVoucherCode;

    private java.util.List<String> codes;

    @NotNull(message = "Shop ID không được để trống")
    private UUID shopId;

    @NotNull(message = "Subtotal không được để trống")
    private BigDecimal subtotal;

    private BigDecimal shippingFee;
}
