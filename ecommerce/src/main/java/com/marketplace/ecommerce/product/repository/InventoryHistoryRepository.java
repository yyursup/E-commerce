package com.marketplace.ecommerce.product.repository;

import com.marketplace.ecommerce.product.entity.InventoryHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, UUID> {
    Page<InventoryHistory> findByShopIdOrderByCreatedAtDesc(UUID shopId, Pageable pageable);
}
