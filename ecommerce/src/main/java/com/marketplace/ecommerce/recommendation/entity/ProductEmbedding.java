package com.marketplace.ecommerce.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lưu embedding vector của sản phẩm (từ Ollama nomic-embed-text).
 * Cột embedding_json: JSON array of numbers, ví dụ "[0.1,-0.2,...]"
 */
@Entity
@Table(name = "product_embeddings", indexes = {
    @Index(name = "idx_product_embedding_product", columnList = "product_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "product_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID productId;

    @Column(name = "embedding_json", nullable = false, columnDefinition = "TEXT")
    private String embeddingJson;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
