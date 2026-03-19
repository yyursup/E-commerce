package com.marketplace.ecommerce.recommendation.service;

import com.marketplace.ecommerce.product.dto.response.ProductResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RecommendationService {

    /**
     * Ghi nhận lượt tìm kiếm (web hoặc chatbot).
     */
    void recordSearch(String sessionId, UUID userId, String keyword, UUID categoryId, BigDecimal minPrice, BigDecimal maxPrice);

    /**
     * Ghi nhận lượt xem sản phẩm.
     */
    void recordProductView(String sessionId, UUID userId, UUID productId);

    /**
     * Gợi ý sản phẩm cho user/session: dựa trên lịch sử tìm kiếm + đã xem (cùng category, embedding).
     */
    List<ProductResponse> getRecommendationsForUser(String sessionId, UUID userId, int limit);

    /**
     * Sản phẩm tương tự với sản phẩm hiện tại (cùng category + embedding similarity).
     */
    List<ProductResponse> getSimilarProducts(UUID productId, int limit);
}
