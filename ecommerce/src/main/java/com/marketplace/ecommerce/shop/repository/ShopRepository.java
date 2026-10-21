package com.marketplace.ecommerce.shop.repository;

import com.marketplace.ecommerce.shop.entity.Shop;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShopRepository extends JpaRepository<Shop, UUID> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByTaxCode(String taxCode);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByUserId(UUID userId);

    Optional<Shop> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Shop s where s.id = :id")
    Optional<Shop> findByIdForUpdate(@Param("id") UUID id);

    @Query("select s from Shop s where s.status = :status and s.suspendedUntil is not null and s.suspendedUntil <= :now")
    List<Shop> findExpiredSuspensions(@Param("status") ShopStatus status, @Param("now") LocalDateTime now);
}
