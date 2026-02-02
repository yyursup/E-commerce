package com.marketplace.ecommerce.product.dto.response;

import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private UUID shopId;
    private String shopName;
    private String name;
    private String description;
    private String sku;
    private String status;
    private BigDecimal basePrice;
    private Integer quantity;
    private List<ProductImageResponse> images;
    private UUID categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    public static ProductResponse from(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .shopId(product.getShop().getId())
                .shopName(product.getShop().getName())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .status(String.valueOf(product.getStatus()))
                .basePrice(product.getBasePrice())
                .quantity(product.getQuantity())
                .images(mapImages(product.getImages()))
                .categoryId(product.getProductCategory().getId())
                .categoryName(product.getProductCategory().getName())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private static List<ProductImageResponse> mapImages(Set<ProductImage> images) {
        if (images == null || images.isEmpty()) return Collections.emptyList();

        return images.stream()
                .sorted(Comparator
                        .comparing(ProductImage::getIsThumbnail, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(ProductImage::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                )
                .map(ProductImageResponse::from)
                .collect(Collectors.toList());
    }

}
