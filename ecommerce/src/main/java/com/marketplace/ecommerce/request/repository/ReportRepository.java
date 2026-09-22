package com.marketplace.ecommerce.request.repository;

import com.marketplace.ecommerce.request.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    Report findByRequestId(UUID requestId);

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

    @Query(value = """
        select a.id
        from shops s
        join users u on u.id = s.user_id
        join accounts a on a.id = u.account_id
        where s.id = :targetId
        """, nativeQuery = true)
    UUID resolveShopOwnerAccountId(@Param("targetId") UUID targetId);

    @Query(value = """
        select a.id
        from products p
        join shops s on s.id = p.shop_id
        join users u on u.id = s.user_id
        join accounts a on a.id = u.account_id
        where p.id = :targetId
        """, nativeQuery = true)
    UUID resolveProductOwnerAccountId(@Param("targetId") UUID targetId);

    @Query(value = """
        select a.id
        from reviews r
        join users u on u.id = r.user_id
        join accounts a on a.id = u.account_id
        where r.id = :targetId
        """, nativeQuery = true)
    UUID resolveReviewOwnerAccountId(@Param("targetId") UUID targetId);


}
