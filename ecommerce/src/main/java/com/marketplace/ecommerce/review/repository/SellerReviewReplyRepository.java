package com.marketplace.ecommerce.review.repository;

import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.entity.SellerReviewReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SellerReviewReplyRepository extends JpaRepository<SellerReviewReply, UUID> {

    Optional<SellerReviewReply> findByReviewId(UUID reviewId);

    boolean existsByReviewId(UUID reviewId);

    @Query("""
    SELECT r
    FROM Review r
    JOIN r.product p
    JOIN p.shop s
    JOIN Order o ON o.id = r.subOrderId
    WHERE s.user.id = :sellerId
      AND r.status = 'ACTIVE'
      AND o.status = 'DELIVERED'
    ORDER BY r.createdAt DESC
    """)
    List<Review> findReviewsForSeller(@Param("sellerId") UUID sellerId);
}
