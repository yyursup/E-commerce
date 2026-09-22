package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.UpdateProductRequest;
import com.marketplace.ecommerce.product.dto.response.SellerProductResponse;

import java.util.UUID;

public interface ProductService {

    SellerProductResponse createProduct(UUID accountId, CreateProductRequest request);

    SellerProductResponse updateProduct(UUID accountId, UUID productId, UpdateProductRequest req);

    void deleteProduct(UUID accountId, UUID productId);

    SellerProductResponse toggleFeatured(UUID accountId, UUID productId);

}
