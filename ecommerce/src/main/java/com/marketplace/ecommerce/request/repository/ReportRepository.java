package com.marketplace.ecommerce.request.repository;

import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    Report findByRequestId(UUID requestId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Report r where r.id = :id")
    Optional<Report> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
        select r from Report r
        join fetch r.request req
        where r.targetType = 'ORDER'
          and r.stage = com.marketplace.ecommerce.request.valueObjects.ReportStage.DIRECT_NEGOTIATION
          and r.sellerResponseDeadline <= :now
    """)
    List<Report> findExpiredDirectNegotiations(@Param("now") java.time.LocalDateTime now);

    @Query("""
        select case when count(r) > 0 then true else false end
        from Report r join r.request req
        where r.targetType = 'ORDER'
          and r.targetId = :orderId
          and (
               r.stage in (
                   com.marketplace.ecommerce.request.valueObjects.ReportStage.DIRECT_NEGOTIATION,
                   com.marketplace.ecommerce.request.valueObjects.ReportStage.RETURN_IN_PROGRESS,
                   com.marketplace.ecommerce.request.valueObjects.ReportStage.ESCALATED_TO_ADMIN
               )
               or req.status = com.marketplace.ecommerce.request.valueObjects.RequestStatus.PENDING
          )
    """)
    boolean hasActiveOrderDispute(@Param("orderId") UUID orderId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where r.targetType = 'ORDER'
          and r.targetId = :orderId
        order by req.createdAt desc
    """)
    List<Report> findByOrderIdOrderByCreatedAtDesc(@Param("orderId") UUID orderId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where req.type = 'REPORT'
          and req.status = 'APPROVED'
          and r.targetType = 'SHOP'
          and r.targetId = :shopId
        order by req.createdAt desc
    """)
    List<Report> findApprovedReportsByShopId(@Param("shopId") UUID shopId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where req.type = 'REPORT'
          and req.status = 'APPROVED'
          and r.targetType = 'PRODUCT'
          and r.targetId in :productIds
        order by req.createdAt desc
    """)
    List<Report> findApprovedReportsByProductIds(@Param("productIds") List<UUID> productIds);

    @Query("""
        select r from Report r
        join fetch r.request req
        where req.type = 'APPEAL'
          and req.account.id = :accountId
        order by req.createdAt desc
    """)
    List<Report> findAllAppealsByAccountId(@Param("accountId") UUID accountId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where req.type = 'APPEAL'
          and req.account.id = :accountId
          and r.targetId = :targetId
        order by req.createdAt desc
    """)
    List<Report> findAppealsByAccountIdAndTargetId(@Param("accountId") UUID accountId, @Param("targetId") UUID targetId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where req.type = 'APPEAL'
          and r.violationReportId = :reportId
        order by req.createdAt desc
    """)
    List<Report> findAppealsByViolationReportId(@Param("reportId") UUID reportId);


    @Query(value = """
              SELECT t.type
              FROM (
                SELECT 'USER' AS type
                WHERE EXISTS (
                    SELECT 1
                    FROM users u
                    WHERE u.id = :id OR u.account_id = :id
                )
                UNION ALL
                SELECT 'SHOP' AS type WHERE EXISTS (SELECT 1 FROM shops s WHERE s.id = :id)
                UNION ALL
                SELECT 'PRODUCT' AS type WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = :id)
                UNION ALL
                SELECT 'REVIEW' AS type WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.id = :id)
                UNION ALL
                SELECT 'ORDER' AS type WHERE EXISTS (SELECT 1 FROM orders o WHERE o.id = :id)
              ) t
            """, nativeQuery = true)
    List<String> resolveTargetTypes(@Param("id") UUID id);

    @Query(value = """
        select resolved.account_id
        from (
            select u.account_id
            from users u
            where u.id = :targetId

            union

            select a.id as account_id
            from accounts a
            where a.id = :targetId
        ) resolved
        limit 1
        """, nativeQuery = true)
    UUID resolveUserAccountId(@Param("targetId") UUID targetId);

    @Query("""
        select s.user.account.id
        from Shop s
        where s.id = :targetId
    """)
    UUID resolveShopOwnerAccountId(@Param("targetId") UUID targetId);

    @Query("""
        select p.shop.user.account.id
        from Product p
        where p.id = :targetId
    """)
    UUID resolveProductOwnerAccountId(@Param("targetId") UUID targetId);

    @Query("""
        select r.user.account.id
        from Review r
        where r.id = :targetId
    """)
    UUID resolveReviewOwnerAccountId(@Param("targetId") UUID targetId);

    @Query("""
        select o.shop.user.account.id
        from Order o
        where o.id = :targetId
    """)
    UUID resolveOrderShopOwnerAccountId(@Param("targetId") UUID targetId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where req.type = com.marketplace.ecommerce.request.valueObjects.RequestType.REPORT
          and r.targetType = com.marketplace.ecommerce.request.valueObjects.TargetType.ORDER
          and r.targetId in (select o.id from Order o where o.shop.id = :shopId)
          and (
               (req.status = com.marketplace.ecommerce.request.valueObjects.RequestStatus.APPROVED
                and r.targetId not in (select o1.id from Order o1 where o1.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED))
            or (r.stage = com.marketplace.ecommerce.request.valueObjects.ReportStage.CLOSED
                and req.reviewedBy is not null
                and r.targetId in (select o2.id from Order o2 where o2.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.REFUNDED))
          )
        order by req.createdAt desc
    """)
    List<Report> findApprovedReportsByShopIdForOrders(@Param("shopId") UUID shopId);

    @Query("""
        select case when count(r) > 0 then true else false end
        from Report r join r.request req
        where r.targetType = 'ORDER'
          and r.targetId = :orderId
          and req.type = 'REPORT'
          and req.status = 'PENDING'
    """)
    boolean existsPendingReportByOrderId(@Param("orderId") UUID orderId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where r.targetType = :targetType
          and r.targetId = :targetId
        order by req.createdAt desc
    """)
    List<Report> findReportsByTargetTypeAndTargetId(@Param("targetType") TargetType targetType, @Param("targetId") UUID targetId);

    @Query("""
        select r from Report r
        join fetch r.request req
        where r.targetType = :targetType
          and r.targetId in :targetIds
        order by req.createdAt desc
    """)
    List<Report> findReportsByTargetTypeAndTargetIdIn(@Param("targetType") TargetType targetType, @Param("targetIds") List<UUID> targetIds);

    @Query("""
        SELECT COUNT(r) > 0
        FROM Report r JOIN r.request req
        WHERE req.status = com.marketplace.ecommerce.request.valueObjects.RequestStatus.PENDING
          AND (
               (r.targetType = com.marketplace.ecommerce.request.valueObjects.TargetType.SHOP AND r.targetId = :shopId)
            OR (r.targetType = com.marketplace.ecommerce.request.valueObjects.TargetType.PRODUCT AND r.targetId IN (SELECT p.id FROM Product p WHERE p.shop.id = :shopId))
            OR (r.targetType = com.marketplace.ecommerce.request.valueObjects.TargetType.ORDER AND r.targetId IN (SELECT o.id FROM Order o WHERE o.shop.id = :shopId))
          )
    """)
    boolean existsPendingReportsForShop(@Param("shopId") UUID shopId);
}

