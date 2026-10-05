package com.marketplace.ecommerce.shop.repository;

import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShopEscrowFundRepository extends JpaRepository<ShopEscrowFund, UUID> {

    Optional<ShopEscrowFund> findByShopId(UUID shopId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM ShopEscrowFund f WHERE f.shop.id = :shopId")
    Optional<ShopEscrowFund> findByShopIdForUpdate(@Param("shopId") UUID shopId);

    List<ShopEscrowFund> findByIsDeficitTrue();

    List<ShopEscrowFund> findByIsDeficitTrueAndDeficitDeadlineBefore(LocalDateTime deadline);

    Page<ShopEscrowFund> findByIsDeficit(Boolean isDeficit, Pageable pageable);

    Page<ShopEscrowFund> findByStatus(EscrowFundStatus status, Pageable pageable);
}
