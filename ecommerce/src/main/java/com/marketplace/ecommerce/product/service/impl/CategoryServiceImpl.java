package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.product.dto.response.CategoryResponse;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final ProductCategoryRepository categoryRepository;

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public CategoryResponse updateCommissionRate(java.util.UUID categoryId, java.math.BigDecimal commissionRate) {
        com.marketplace.ecommerce.product.entity.ProductCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new com.marketplace.ecommerce.common.exception.CustomException("Không tìm thấy danh mục: " + categoryId));
        category.setCommissionRate(commissionRate);
        category = categoryRepository.save(category);
        return CategoryResponse.from(category);
    }
}
