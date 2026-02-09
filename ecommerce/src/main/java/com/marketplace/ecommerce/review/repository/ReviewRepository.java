package com.marketplace.ecommerce.review.repository;

import com.marketplace.ecommerce.review.dto.projection.ReviewStatsProjection;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    boolean existsByUserIdAndProductIdAndSubOrderIdAndStatus(UUID userId, UUID productId, UUID subOrderId, ReviewStatus status);

    Optional<Review> findByUserIdAndProductIdAndSubOrderId(
            UUID userId, UUID productId, UUID subOrderId
    );

    @EntityGraph(attributePaths = {"user", "images", "reply"})
    @Query("""
            SELECT r FROM Review r
            WHERE r.product.id = :productId
              AND r.status = :status
              AND (:rating IS NULL OR r.rating = :rating)
              AND (
                    :hasImages IS NULL
                    OR (:hasImages = true  AND SIZE(r.images) > 0)
                    OR (:hasImages = false AND SIZE(r.images) = 0)
                  )
            """)
    Page<Review> findWithFilters(
            @Param("productId") UUID productId,
            @Param("status") ReviewStatus status,
            @Param("rating") Integer rating,
            @Param("hasImages") Boolean hasImages,
            Pageable pageable
    );


    @Query("""
                select
                  avg(r.rating) as avgRating,
                  count(r) as totalReviews,
            
                  sum(case when exists (
                      select 1 from ReviewImage i
                      where i.review = r
                  ) then 1 else 0 end) as withImages,
            
                  sum(case when r.comment is not null and r.comment <> '' then 1 else 0 end) as withComments,
            
                  sum(case when r.rating = 1 then 1 else 0 end) as star1,
                  sum(case when r.rating = 2 then 1 else 0 end) as star2,
                  sum(case when r.rating = 3 then 1 else 0 end) as star3,
                  sum(case when r.rating = 4 then 1 else 0 end) as star4,
                  sum(case when r.rating = 5 then 1 else 0 end) as star5
                from Review r
                where r.product.id = :productId
                  and r.status = :status
            """)
    ReviewStatsProjection getStats(@Param("productId") UUID productId,
                                   @Param("status") ReviewStatus status);
}
