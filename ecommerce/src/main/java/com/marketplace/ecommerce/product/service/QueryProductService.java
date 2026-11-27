package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.dto.response.SellerProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface QueryProductService {

    ProductResponse getPublishedProductById(UUID productId);

    SellerProductResponse getProductById(UUID productId);

//    List<ProductResponse> getAllProductsByShop(UUID shopId);

    // Sản phẩm của shop (phân trang); q tìm theo tên, SKU, tên danh mục
    Page<SellerProductResponse> getProductsByShop(UUID accountId, String status, String q, org.springframework.data.domain.Pageable pageable);

    long countFeaturedProducts(UUID accountId);

    Page<ProductResponse> getPublishedProducts(PageQueryRequest req);

    List<ProductResponse> getPublishedProductsByIds(List<UUID> ids);

    List<ProductResponse> getFeaturedProductsByShop(UUID shopId);
}
