package com.marketplace.ecommerce.order.repository;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    Optional<Order> findByIdAndShopId(UUID id, UUID shopId);

    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, OrderStatus status);

    List<Order> findByShopIdOrderByCreatedAtDesc(UUID shopId);

    List<Order> findByShopIdAndStatusOrderByCreatedAtDesc(UUID shopId, OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    Optional<Order> findByGhnOrderCode(String ghnOrderCode);

    List<Order> findByStatusAndReceivedByBuyerFalseAndDeliveredAtBefore(OrderStatus orderStatus, LocalDateTime threshold);

}
