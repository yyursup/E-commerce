package com.marketplace.ecommerce.recommendation.repository;

import com.marketplace.ecommerce.recommendation.entity.ProductEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductEmbeddingRepository extends JpaRepository<ProductEmbedding, UUID> {

    Optional<ProductEmbedding> findByProductId(UUID productId);

    @Query("SELECT e FROM ProductEmbedding e WHERE e.productId IN :productIds")
    List<ProductEmbedding> findByProductIdIn(@Param("productIds") List<UUID> productIds);

    @Query("SELECT e FROM ProductEmbedding e WHERE e.productId <> :excludeProductId")
    List<ProductEmbedding> findAllExceptProduct(@Param("excludeProductId") UUID excludeProductId);
}
