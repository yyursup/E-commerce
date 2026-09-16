package com.marketplace.ecommerce.order.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class QuoteRequest {
    private UUID shopId;
    private UUID addressId;
    private String voucherCode;
    private String shopVoucherCode;
    private String platformVoucherCode;
    private java.util.List<String> voucherCodes;
}
