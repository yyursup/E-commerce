package com.marketplace.ecommerce.product.validate;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.ProductVariantRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ProductValidationTest {

    private final ProductValidation validator = new ProductValidation();

    @Test
    @DisplayName("Bỏ qua khi variants null hoặc empty")
    void testValidateVariants_NullOrEmpty() {
        assertDoesNotThrow(() -> validator.validateVariants(null));
        assertDoesNotThrow(() -> validator.validateVariants(List.of()));
    }

    @Test
    @DisplayName("Ném lỗi khi cả color và size đều rỗng")
    void testValidateVariants_EmptyColorAndSize() {
        ProductVariantRequest v = new ProductVariantRequest();
        v.setColor("");
        v.setSize("");
        v.setPrice(BigDecimal.TEN);
        v.setStock(10);

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v)));
        assertTrue(ex.getMessage().contains("không được để trống cả 2 thuộc tính"));
    }

    @Test
    @DisplayName("Ném lỗi khi giá phân loại âm")
    void testValidateVariants_NegativePrice() {
        ProductVariantRequest v = new ProductVariantRequest();
        v.setColor("Đen");
        v.setSize("128GB");
        v.setPrice(BigDecimal.valueOf(-1));
        v.setStock(10);

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v)));
        assertTrue(ex.getMessage().contains("phải lớn hơn hoặc bằng 0"));
    }

    @Test
    @DisplayName("Ném lỗi khi tồn kho phân loại âm")
    void testValidateVariants_NegativeStock() {
        ProductVariantRequest v = new ProductVariantRequest();
        v.setColor("Đen");
        v.setSize("128GB");
        v.setPrice(BigDecimal.valueOf(1000));
        v.setStock(-5);

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v)));
        assertTrue(ex.getMessage().contains("không được âm"));
    }

    @Test
    @DisplayName("Ném lỗi khi phát hiện phân loại trùng lặp thuộc tính")
    void testValidateVariants_Duplicate() {
        ProductVariantRequest v1 = new ProductVariantRequest();
        v1.setColor("Đen");
        v1.setSize("128GB");
        v1.setPrice(BigDecimal.valueOf(1000));
        v1.setStock(5);

        ProductVariantRequest v2 = new ProductVariantRequest();
        v2.setColor("đen");
        v2.setSize("128gb");
        v2.setPrice(BigDecimal.valueOf(1000));
        v2.setStock(5);

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v1, v2)));
        assertTrue(ex.getMessage().contains("trùng lặp"));

        // Duplicate only color (size null)
        v1.setSize(null);
        v2.setSize(null);
        assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v1, v2)));

        // Duplicate only size (color null)
        v1.setColor(null);
        v1.setSize("XL");
        v2.setColor(null);
        v2.setSize("xl");
        assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v1, v2)));

        // Null price & null stock
        v1.setPrice(null);
        assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v1)));
        v1.setPrice(BigDecimal.TEN);
        v1.setStock(null);
        assertThrows(CustomException.class, () -> validator.validateVariants(List.of(v1)));
    }

    @Test
    @DisplayName("Thành công khi danh sách phân loại hợp lệ")
    void testValidateVariants_Success() {
        ProductVariantRequest v1 = new ProductVariantRequest();
        v1.setColor("Đen");
        v1.setSize("128GB");
        v1.setPrice(BigDecimal.valueOf(1000));
        v1.setStock(5);

        ProductVariantRequest v2 = new ProductVariantRequest();
        v2.setColor("Trắng");
        v2.setSize("256GB");
        v2.setPrice(BigDecimal.valueOf(1200));
        v2.setStock(3);

        assertDoesNotThrow(() -> validator.validateVariants(List.of(v1, v2)));
    }
}
