package com.marketplace.ecommerce.product.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantRequest {

    private UUID id;

    private String color;

    private String size;

    @NotNull(message = "Variant price must not be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Variant price must be greater than or equal to 0")
    private BigDecimal price;

    @NotNull(message = "Variant stock must not be null")
    @Min(value = 0, message = "Variant stock must be greater than or equal to 0")
    private Integer stock;
}
