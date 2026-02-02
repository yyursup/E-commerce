package com.marketplace.ecommerce.cart.validate;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CartValidation {


    public int normalizeAndValidateQuantity(Integer qty) {
        if (qty == null || qty <= 0) {
            throw new RuntimeException("Quantity must be > 0");
        }
        return qty;
    }

    public void ensureStock(Product product, int desiredQty, String message) {
        if (product.getQuantity() < desiredQty) {
            throw new CustomException(message);
        }
    }
}
