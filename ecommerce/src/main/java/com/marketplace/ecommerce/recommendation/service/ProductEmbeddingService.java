package com.marketplace.ecommerce.recommendation.service;

import com.marketplace.ecommerce.product.entity.Product;

import java.util.UUID;

public interface ProductEmbeddingService {

    /**
     * Đảm bảo sản phẩm đã có embedding (tạo mới nếu chưa có hoặc đã cũ).
     */
    void ensureEmbedding(UUID productId);

    /**
     * Lấy embedding vector của sản phẩm (tính và lưu nếu chưa có). Trả về null nếu Ollama lỗi.
     */
    float[] getOrComputeEmbedding(Product product);

    /**
     * Lấy embedding đã lưu (không gọi Ollama). Trả về null nếu chưa có.
     */
    float[] getStoredEmbedding(UUID productId);
}
