package com.marketplace.ecommerce.shop.repository;

import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrustLevelConfigRepository extends JpaRepository<TrustLevelConfig, UUID> {

    Optional<TrustLevelConfig> findByStarLevel(Integer starLevel);

    List<TrustLevelConfig> findAllByOrderByStarLevelAsc();

    List<TrustLevelConfig> findAllByIsActiveTrueOrderByStarLevelAsc();

    boolean existsByStarLevel(Integer starLevel);
}
