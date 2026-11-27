package com.marketplace.ecommerce.cart.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    @NotNull(message = "Vui lòng chọn sản phẩm")
    private UUID productId;


    @NotNull(message = "Vui lòng nhập số lượng")
    @Min(value = 1, message = "Số lượng phải từ 1 trở lên")
    private Integer quantity;

    private UUID variantId;
}
