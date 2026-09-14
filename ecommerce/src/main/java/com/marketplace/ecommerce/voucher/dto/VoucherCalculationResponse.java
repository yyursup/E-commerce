package com.marketplace.ecommerce.voucher.dto;

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
public class VoucherCalculationResponse {

    private boolean valid;
    private String message;
    private UUID voucherId;
    private String voucherCode;
    private String title;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal finalTotal;
}
