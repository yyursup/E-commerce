package com.marketplace.ecommerce.social.repository;

import com.marketplace.ecommerce.social.entity.ShopFollower;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShopFollowerRepository extends JpaRepository<ShopFollower, UUID> {
    Optional<ShopFollower> findByUserIdAndShopId(UUID userId, UUID shopId);

    boolean existsByUserIdAndShopId(UUID userId, UUID shopId);

    void deleteByUserIdAndShopId(UUID userId, UUID shopId);

    long countByShopId(UUID shopId);

    Page<ShopFollower> findByUserId(UUID userId, Pageable pageable);
}
