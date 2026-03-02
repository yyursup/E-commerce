package com.marketplace.ecommerce.platform.repository;

import com.marketplace.ecommerce.platform.entity.Commission;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommissionRepository extends
        JpaRepository<Commission, UUID>,
        JpaSpecificationExecutor<Commission> {

    Optional<Commission> findByOrderId(UUID orderId);

    boolean existsByOrderId(UUID orderId);

    @Query("""
        SELECT
            COALESCE(SUM(c.totalCommission), 0),
            COUNT(c),
            COALESCE(
                CASE
                    WHEN COALESCE(SUM(c.orderAmount), 0) = 0 THEN 0
                    ELSE (SUM(c.totalCommission) * 100.0 / SUM(c.orderAmount))
                END
            , 0)
        FROM Commission c
    """)
    List<Object[]> getOverviewStatistics();

    @Query("""
        SELECT
            YEAR(c.createdAt),
            MONTH(c.createdAt),
            COALESCE(SUM(c.totalCommission), 0)
        FROM Commission c
        GROUP BY YEAR(c.createdAt), MONTH(c.createdAt)
        ORDER BY YEAR(c.createdAt), MONTH(c.createdAt)
    """)
    List<Object[]> getCommissionByMonth();

    @Query("""
                SELECT
                    c.sellerId,
                    COALESCE(SUM(c.totalCommission), 0)
                FROM Commission c
                GROUP BY c.sellerId
                ORDER BY COALESCE(SUM(c.totalCommission), 0) DESC
            """)
    List<Object[]> getTopSellerCommission(Pageable pageable);

    @Query("""
        SELECT COALESCE(SUM(c.totalCommission), 0)
        FROM Commission c
        WHERE c.sellerId = :sellerId
    """)
    BigDecimal getTotalCommissionBySeller(UUID sellerId);

    @Query("""
        SELECT COALESCE(SUM((ci.unitPrice * ci.quantity) - ci.commissionAmount), 0)
        FROM CommissionItem ci
        JOIN ci.commission c
        WHERE c.sellerId = :sellerId
    """)
    BigDecimal getTotalNetIncomeBySeller(UUID sellerId);
}