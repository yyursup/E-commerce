package com.marketplace.ecommerce.product.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class PageQueryRequest {
    @Min(0)
    private Integer page = 0;

    @Min(1)
    @Max(100)
    private Integer size = 20;

    private String search;

    private UUID categoryId;

    private UUID shopId;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;

    private String sortBy = "createdAt";

    private String sortDir = "desc";
}
