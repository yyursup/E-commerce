package com.marketplace.ecommerce.order.repository;

import com.marketplace.ecommerce.order.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemsRepository extends JpaRepository<OrderItem, UUID> {

    @Query("""
        SELECT oi.product.id, oi.productName, oi.product.conditionGrade, oi.unitPrice, SUM(oi.quantity), SUM(oi.totalPrice), oi.product.quantity
        FROM OrderItem oi
        WHERE oi.order.shop.id = :shopId
          AND oi.order.status IN (com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED, com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED, com.marketplace.ecommerce.order.valueObjects.OrderStatus.SHIPPING)
        GROUP BY oi.product.id, oi.productName, oi.product.conditionGrade, oi.unitPrice, oi.product.quantity
        ORDER BY SUM(oi.quantity) DESC
    """)
    List<Object[]> getTopSellingProductsByShop(@Param("shopId") UUID shopId, Pageable pageable);

    @Query("""
        SELECT p.conditionGrade, COUNT(oi), SUM(oi.quantity), COALESCE(SUM(oi.totalPrice), 0)
        FROM OrderItem oi
        JOIN oi.product p
        WHERE (:shopId IS NULL OR oi.order.shop.id = :shopId)
          AND oi.order.status IN (com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED, com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED)
        GROUP BY p.conditionGrade
    """)
    List<Object[]> getConditionGradeBreakdown(@Param("shopId") UUID shopId);

    @Query("""
        SELECT c.id, c.name, COALESCE(SUM(oi.totalPrice), 0), SUM(oi.quantity)
        FROM OrderItem oi
        JOIN oi.product p
        JOIN p.productCategory c
        WHERE oi.order.user.id = :userId
          AND oi.order.status IN (com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED, com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED)
        GROUP BY c.id, c.name
        ORDER BY SUM(oi.totalPrice) DESC
    """)
    List<Object[]> getBuyerCategorySpending(@Param("userId") UUID userId);

    @Query("""
        SELECT oi
        FROM OrderItem oi
        JOIN FETCH oi.order o
        JOIN FETCH oi.product p
        WHERE o.user.id = :userId
          AND o.status IN (com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED, com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED, com.marketplace.ecommerce.order.valueObjects.OrderStatus.SHIPPING)
        ORDER BY o.createdAt DESC
    """)
    List<OrderItem> findPurchasedDevicesByUser(@Param("userId") UUID userId, Pageable pageable);
}

