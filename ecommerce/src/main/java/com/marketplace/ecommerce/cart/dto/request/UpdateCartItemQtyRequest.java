package com.marketplace.ecommerce.cart.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class UpdateCartItemQtyRequest {
    private UUID productId;
    private int delta;
}
