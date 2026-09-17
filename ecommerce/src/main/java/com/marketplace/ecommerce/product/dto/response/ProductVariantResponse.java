package com.marketplace.ecommerce.product.dto.response;

import com.marketplace.ecommerce.product.entity.ProductVariant;
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
public class ProductVariantResponse {
    private UUID id;
    private String color;
    private String size;
    private BigDecimal price;
    private Integer stock;
    private Integer sold;

    public static ProductVariantResponse from(ProductVariant variant) {
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .color(variant.getColor())
                .size(variant.getSize())
                .price(variant.getPrice())
                .stock(variant.getStock())
                .sold(variant.getSold())
                .build();
    }
}
