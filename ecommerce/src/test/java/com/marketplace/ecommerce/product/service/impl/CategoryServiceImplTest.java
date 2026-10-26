package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.response.CategoryResponse;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private ProductCategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    @DisplayName("getAllCategories trả về toàn bộ danh mục")
    void testGetAllCategories() {
        ProductCategory c = new ProductCategory();
        c.setId(UUID.randomUUID());
        c.setName("Tai nghe");

        when(categoryRepository.findAll()).thenReturn(List.of(c));

        List<CategoryResponse> res = categoryService.getAllCategories();
        assertEquals(1, res.size());
        assertEquals("Tai nghe", res.get(0).getName());
    }

    @Test
    @DisplayName("updateCommissionRate cập nhật hoa hồng thành công")
    void testUpdateCommissionRate_Success() {
        UUID catId = UUID.randomUUID();
        ProductCategory c = new ProductCategory();
        c.setId(catId);
        c.setName("Laptop");
        c.setCommissionRate(BigDecimal.valueOf(5.0));

        when(categoryRepository.findById(catId)).thenReturn(Optional.of(c));
        when(categoryRepository.save(any(ProductCategory.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryResponse res = categoryService.updateCommissionRate(catId, BigDecimal.valueOf(7.5));
        assertNotNull(res);
        assertEquals(BigDecimal.valueOf(7.5), c.getCommissionRate());
    }

    @Test
    @DisplayName("updateCommissionRate ném lỗi khi không tìm thấy danh mục")
    void testUpdateCommissionRate_NotFound() {
        UUID catId = UUID.randomUUID();
        when(categoryRepository.findById(catId)).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> categoryService.updateCommissionRate(catId, BigDecimal.valueOf(5.0)));
    }
}
