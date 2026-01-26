package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface QueryProductService {

    ProductResponse getPublishedProductById(UUID productId);

    ProductResponse getProductById(UUID productId);

//    List<ProductResponse> getAllProductsByShop(UUID shopId);

    List<ProductResponse> getProductsByShopAndStatus(UUID accountId, String status);

    Page<ProductResponse> getPublishedProducts(PageQueryRequest req);
}
