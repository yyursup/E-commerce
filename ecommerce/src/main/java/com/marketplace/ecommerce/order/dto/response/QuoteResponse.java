package com.marketplace.ecommerce.order.dto.response;


import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuoteResponse {
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private String voucherCode;
    private BigDecimal total;
}
