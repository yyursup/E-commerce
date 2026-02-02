package com.marketplace.ecommerce.order.repository;

import com.marketplace.ecommerce.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderItemsRepository extends JpaRepository<OrderItem, UUID> {
}
