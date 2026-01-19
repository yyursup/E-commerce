package com.marketplace.ecommerce.shop.repository;

import com.marketplace.ecommerce.shop.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
@Repository
public interface ShopRepository extends JpaRepository<Shop, UUID> {
}
