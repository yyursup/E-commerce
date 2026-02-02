package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
}
