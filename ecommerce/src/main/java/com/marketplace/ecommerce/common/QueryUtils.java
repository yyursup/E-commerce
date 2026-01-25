package com.marketplace.ecommerce.common;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
public class QueryUtils {

    public Sort createSort(String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        if (sortBy == null || sortBy.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }

        switch (sortBy.trim().toLowerCase()) {
            case "price":
                return Sort.by(direction, "basePrice");
            case "name":
                return Sort.by(direction, "name");
            case "created":
            case "createdat":
                return Sort.by(direction, "createdAt");
            default:
                return Sort.by(Sort.Direction.DESC, "createdAt");
        }
    }
}
