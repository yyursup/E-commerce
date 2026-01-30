package com.marketplace.ecommerce.order.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateOrderRequest {
    @NotNull(message = "Shop ID is required")
    private UUID shopId;
    private UUID addressId;
    private String notes;

}
