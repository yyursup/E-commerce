package com.marketplace.ecommerce.shop.repository;

import com.marketplace.ecommerce.shop.entity.Shop;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShopRepository extends JpaRepository<Shop, UUID> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByUserId(UUID userId);

    Optional<Shop> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Shop s where s.id = :id")
    Optional<Shop> findByIdForUpdate(@Param("id") UUID id);

}
