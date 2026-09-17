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
    private String code;
    private String title;

    private String shopVoucherCode;
    private String shopVoucherTitle;
    private BigDecimal shopDiscountAmount;

    private String platformVoucherCode;
    private String platformVoucherTitle;
    private BigDecimal platformDiscountAmount;

    private java.util.List<VoucherResponse> appliedVouchers;

    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal finalTotal;
}
