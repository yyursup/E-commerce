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

    java.util.List<SellerProductResponse> getPendingProducts();

    SellerProductResponse approveProduct(UUID adminAccountId, UUID productId);

    SellerProductResponse rejectProduct(UUID adminAccountId, UUID productId, String reason);
    
    /**
     * Vô hiệu hóa toàn bộ sản phẩm đang bán (PUBLISHED) và chờ duyệt (PENDING_APPROVAL)
     * của gian hàng sang trạng thái INACTIVE khi gian hàng chính thức đóng cửa (ShopStatus.CLOSED).
     *
     * @param shopId Định danh của gian hàng vừa đóng cửa
     */
    void deactivateProductsOnShopClose(UUID shopId);
}
