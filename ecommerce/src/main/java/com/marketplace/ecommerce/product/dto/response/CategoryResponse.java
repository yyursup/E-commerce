package com.marketplace.ecommerce.product.dto.response;

import com.marketplace.ecommerce.product.entity.ProductCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private UUID id;
    private String name;
    private java.math.BigDecimal commissionRate;
    private UUID parentId;
    private String parentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CategoryResponse from(ProductCategory category) {
        java.math.BigDecimal effectiveRate = category.getCommissionRate();
        if (effectiveRate == null && category.getParent() != null) {
            effectiveRate = category.getParent().getCommissionRate();
        }

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .commissionRate(effectiveRate)
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
