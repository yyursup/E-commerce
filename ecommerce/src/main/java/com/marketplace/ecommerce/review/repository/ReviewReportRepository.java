package com.marketplace.ecommerce.review.repository;

import com.marketplace.ecommerce.review.entity.ReviewReport;
import com.marketplace.ecommerce.review.valueObjects.ReviewReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, UUID> {

    boolean existsByReviewIdAndReporterId(UUID reviewId, UUID reporterId);

    boolean existsByReviewIdAndReporterIp(UUID reviewId, String reporterIp);

    long countByReviewId(UUID reviewId);

    long countByStatus(ReviewReportStatus status);

    @Query("""
        SELECT COUNT(DISTINCT rr.review.id)
        FROM ReviewReport rr
        WHERE rr.status = :status
    """)
    long countDistinctReviewByStatus(@Param("status") ReviewReportStatus status);

    @Query("""
        select r.id,
               r.comment,
               u.email,
               count(rr),
               max(rr.createdAt)
        from ReviewReport rr
        join rr.review r
        join r.user u
        where rr.status = :status
        group by r.id, r.comment, u.email
        order by max(rr.createdAt) desc
    """)
    List<Object[]> findReportedReviewsGrouped(
            @Param("status") ReviewReportStatus status
    );

    @Query("""
        select rr
        from ReviewReport rr
        left join fetch rr.reporter ru
        where rr.review.id = :reviewId
        and rr.status = :status
        order by rr.createdAt desc
    """)
    List<ReviewReport> findReportsByReviewId(
            @Param("reviewId") UUID reviewId,
            @Param("status") ReviewReportStatus status
    );

    Optional<ReviewReport> findByReviewIdAndReporterId(
            UUID reviewId,
            UUID reporterId
    );

    @Query("""
    SELECT COUNT(DISTINCT rr.review.id)
    FROM ReviewReport rr
    WHERE rr.review.user.id = :userId
      AND rr.status = 'REVIEWED'
      AND rr.createdAt >= :fromDate
    """)
    long countReviewedReportsByUserInPeriod(
            @Param("userId") UUID userId,
            @Param("fromDate") LocalDateTime fromDate
    );

    @Modifying
    @Query("""
    UPDATE ReviewReport rr
    SET rr.status = :status
    WHERE rr.review.id = :reviewId
      AND rr.status = 'PENDING'
    """)
    int updateStatusByReviewId(
            @Param("reviewId") UUID reviewId,
            @Param("status") ReviewReportStatus status
    );

    @Query("""
    SELECT COUNT(rr) > 0
    FROM ReviewReport rr
    WHERE rr.review.user.id = :userId
      AND rr.review.product.id = :productId
      AND rr.review.subOrderId = :subOrderId
      AND rr.status = 'REVIEWED'
    """)
    boolean existsReviewedReport(
            @Param("userId") UUID userId,
            @Param("productId") UUID productId,
            @Param("subOrderId") UUID subOrderId
    );
}
