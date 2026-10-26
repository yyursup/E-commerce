package com.marketplace.ecommerce.cart.validate;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CartValidationTest {

    private final CartValidation validator = new CartValidation();

    @Test
    @DisplayName("normalizeAndValidateQuantity ném lỗi khi số lượng <= 0 hoặc null")
    void testNormalizeAndValidateQuantity_Invalid() {
        assertThrows(RuntimeException.class, () -> validator.normalizeAndValidateQuantity(null));
        assertThrows(RuntimeException.class, () -> validator.normalizeAndValidateQuantity(0));
        assertThrows(RuntimeException.class, () -> validator.normalizeAndValidateQuantity(-2));
        assertEquals(5, validator.normalizeAndValidateQuantity(5));
    }

    @Test
    @DisplayName("ensureStock ném lỗi khi số lượng yêu cầu vượt tồn kho")
    void testEnsureStock() {
        Product p = new Product();
        p.setQuantity(3);

        CustomException ex = assertThrows(CustomException.class, () -> validator.ensureStock(p, 5, "Hết hàng"));
        assertEquals("Hết hàng", ex.getMessage());

        assertDoesNotThrow(() -> validator.ensureStock(p, 3, "Đủ hàng"));
        assertDoesNotThrow(() -> validator.ensureStock(p, 2, "Đủ hàng"));
    }
}
