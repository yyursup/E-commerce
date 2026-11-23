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

    @NotNull(message = "Vui lòng nhập giá biến thể")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá biến thể phải từ 0 trở lên")
    private BigDecimal price;

    @NotNull(message = "Vui lòng nhập tồn kho biến thể")
    @Min(value = 0, message = "Tồn kho biến thể phải từ 0 trở lên")
    private Integer stock;
}
