package com.marketplace.ecommerce.order.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class QuoteRequest {
    private UUID shopId;
    private UUID addressId;
}
