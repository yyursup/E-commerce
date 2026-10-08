package com.marketplace.ecommerce.shop.repository;

import com.marketplace.ecommerce.shop.entity.ShopEscrowTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShopEscrowTransactionRepository extends JpaRepository<ShopEscrowTransaction, UUID> {

    List<ShopEscrowTransaction> findByFundIdOrderByCreatedAtDesc(UUID fundId);

    Page<ShopEscrowTransaction> findByFundIdOrderByCreatedAtDesc(UUID fundId, Pageable pageable);

    Page<ShopEscrowTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByReferenceCode(String referenceCode);

    @Query("SELECT COALESCE(SUM(ABS(t.amount)), 0) FROM ShopEscrowTransaction t WHERE t.orderId = :orderId AND t.transactionType = com.marketplace.ecommerce.shop.valueObjects.EscrowFundTransactionType.COMPENSATION_DEDUCTION")
    java.math.BigDecimal sumCompensationByOrderId(@org.springframework.data.repository.query.Param("orderId") UUID orderId);
}
