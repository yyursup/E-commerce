package com.marketplace.ecommerce.voucher.repository;

import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, UUID> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query("SELECT v FROM Voucher v WHERE v.status = :status " +
            "AND (v.startDate IS NULL OR v.startDate <= :now) " +
            "AND (v.endDate IS NULL OR v.endDate >= :now) " +
            "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)")
    List<Voucher> findAllCurrentlyActive(@Param("status") VoucherStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT v FROM Voucher v WHERE v.status = :status " +
            "AND v.scope = :scope " +
            "AND (v.startDate IS NULL OR v.startDate <= :now) " +
            "AND (v.endDate IS NULL OR v.endDate >= :now) " +
            "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)")
    List<Voucher> findActiveByScope(
            @Param("status") VoucherStatus status,
            @Param("scope") VoucherScope scope,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT v FROM Voucher v WHERE v.status = :status " +
            "AND v.shop.id = :shopId " +
            "AND (v.startDate IS NULL OR v.startDate <= :now) " +
            "AND (v.endDate IS NULL OR v.endDate >= :now) " +
            "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)")
    List<Voucher> findActiveByShopId(
            @Param("status") VoucherStatus status,
            @Param("shopId") UUID shopId,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT v FROM Voucher v WHERE v.status = :status " +
            "AND (v.scope = com.marketplace.ecommerce.voucher.valueObjects.VoucherScope.PLATFORM OR v.shop.id = :shopId) " +
            "AND (v.startDate IS NULL OR v.startDate <= :now) " +
            "AND (v.endDate IS NULL OR v.endDate >= :now) " +
            "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)")
    List<Voucher> findActiveForCheckout(
            @Param("status") VoucherStatus status,
            @Param("shopId") UUID shopId,
            @Param("now") LocalDateTime now
    );

    List<Voucher> findByShopIdOrderByCreatedAtDesc(UUID shopId);
}
