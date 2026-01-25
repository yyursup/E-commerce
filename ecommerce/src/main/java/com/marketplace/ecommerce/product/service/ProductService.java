package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.request.UpdateProductRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface ProductService {

    ProductResponse createProduct(UUID accountId, CreateProductRequest request);

    ProductResponse updateProduct(UUID accountId, UUID productId, UpdateProductRequest req);

    void deleteProduct(UUID accountId, UUID productId);


}
