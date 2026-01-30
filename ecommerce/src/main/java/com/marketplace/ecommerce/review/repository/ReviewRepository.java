package com.marketplace.ecommerce.review.repository;

import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND r.status = :status")
    Page<Review> findByProductIdAndStatus(
            @Param("productId") UUID productId,
            @Param("status") ReviewStatus status,
            Pageable pageable
    );

    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND r.status = :status AND r.rating = :rating")
    Page<Review> findByProductIdAndStatusAndRating(
            @Param("productId") UUID productId,
            @Param("status") ReviewStatus status,
            @Param("rating") Integer rating,
            Pageable pageable
    );

    @Query("SELECT r FROM Review r " +
            "WHERE r.product.id = :productId " +
            "AND r.status = :status " +
            "AND (:rating IS NULL OR r.rating = :rating) " +
            "AND (:hasImages IS NULL OR :hasImages = false OR SIZE(r.images) > 0)")
    Page<Review> findWithFilters(
            @Param("productId") UUID productId,
            @Param("status") ReviewStatus status,
            @Param("rating") Integer rating,
            @Param("hasImages") Boolean hasImages,
            Pageable pageable
    );

    Optional<Review> findByUserIdAndProductIdAndSubOrderId(
            UUID userId, UUID productId, UUID subOrderId
    );

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.status = 'ACTIVE'")
    Double getAverageRating(@Param("productId") UUID productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.status = 'ACTIVE'")
    long countByProductId(@Param("productId") UUID productId);
}
