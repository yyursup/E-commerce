package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.entity.Product;

public interface ProductImageService {

    void createProductImage(Product product, CreateProductRequest request);
}
