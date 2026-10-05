package com.marketplace.ecommerce.order.repository;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
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

  @Query("""
          SELECT COUNT(o)
          FROM Order o
          WHERE o.user.id = :userId
            AND (o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED
                 OR o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED)
      """)
  long countCompletedOrdersByUserId(@Param("userId") UUID userId);

  List<Order> findByShopIdOrderByCreatedAtDesc(UUID shopId);

  List<Order> findByShopIdAndStatusOrderByCreatedAtDesc(UUID shopId, OrderStatus status);

  List<Order> findAllByOrderByCreatedAtDesc();

  List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

  Optional<Order> findByGhnOrderCode(String ghnOrderCode);

  @Query("SELECT o FROM Order o WHERE o.shop = :shop ORDER BY o.createdAt DESC")
  List<Order> getOrdersByShop(@Param("shop") Shop shop);

  @Query("""
          select o.id
          from Order o
          where o.status = :status
            and o.receivedByBuyer = false
            and o.deliveredAt < :threshold
          order by o.deliveredAt asc
      """)
  List<UUID> findIdsByStatusAndReceivedByBuyerFalseAndDeliveredAtBefore(
      @Param("status") OrderStatus status,
      @Param("threshold") LocalDateTime threshold);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select o from Order o where o.id = :id")
  Optional<Order> findByIdForUpdate(@Param("id") UUID id);

  /**
   * Doanh thu ước tính: tổng tiền hàng (subtotal), không bao gồm phí ship (bên
   * thứ 3).
   */
  @Query("""
      SELECT COALESCE(SUM(o.subtotal), 0)
      FROM Order o
      WHERE o.shop.id = :shopId
        AND o.status IN :statuses
      """)
  BigDecimal getEstimatedRevenueByShop(
      @Param("shopId") UUID shopId,
      @Param("statuses") List<OrderStatus> statuses);

  /**
   * Doanh thu từ đơn đã giao/hoàn thành: tổng tiền hàng (subtotal), không bao gồm
   * phí ship.
   */
  @Query("""
      SELECT COALESCE(SUM(o.subtotal), 0)
      FROM Order o
      WHERE o.shop.id = :shopId
        AND o.status IN :revenueStatuses
        AND o.deliveredAt IS NOT NULL
      """)
  BigDecimal getRevenueByShop(
      @Param("shopId") UUID shopId,
      @Param("revenueStatuses") List<OrderStatus> revenueStatuses);

  long countByShop_IdAndCreatedAtAfter(UUID shopId, LocalDateTime createdAt);

  @Query("""
      SELECT o.shop.id, o.shop.name, COALESCE(SUM(o.total), 0), COUNT(o)
      FROM Order o
      WHERE o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED
      OR o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED
      GROUP BY o.shop.id, o.shop.name
      ORDER BY SUM(o.total) DESC
      """)
  List<Object[]> getShopRankingByRevenue();

  long countByStatus(OrderStatus status);

  long countByShopIdAndStatus(UUID shopId, OrderStatus status);

  long countByShopId(UUID shopId);

  @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status <> com.marketplace.ecommerce.order.valueObjects.OrderStatus.CANCELLED")
  BigDecimal getPlatformTotalGmv();

  @Query("""
      SELECT COALESCE(SUM(o.total), 0)
      FROM Order o
      WHERE o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED
         OR o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED
  """)
  BigDecimal getPlatformSettledRevenue();

  @Query("""
      SELECT CAST(o.createdAt as LocalDate), COALESCE(SUM(o.total), 0), COUNT(o)
      FROM Order o
      WHERE o.createdAt >= :startDate
        AND o.status <> com.marketplace.ecommerce.order.valueObjects.OrderStatus.CANCELLED
      GROUP BY CAST(o.createdAt as LocalDate)
      ORDER BY CAST(o.createdAt as LocalDate) ASC
  """)
  List<Object[]> getDailyPlatformGmvSince(@Param("startDate") LocalDateTime startDate);

  @Query("""
      SELECT CAST(o.createdAt as LocalDate), COALESCE(SUM(o.subtotal), 0), COUNT(o)
      FROM Order o
      WHERE o.shop.id = :shopId
        AND o.createdAt >= :startDate
        AND o.status <> com.marketplace.ecommerce.order.valueObjects.OrderStatus.CANCELLED
      GROUP BY CAST(o.createdAt as LocalDate)
      ORDER BY CAST(o.createdAt as LocalDate) ASC
  """)
  List<Object[]> getShopDailySalesSince(@Param("shopId") UUID shopId, @Param("startDate") LocalDateTime startDate);

  @Query("""
      SELECT COALESCE(SUM(o.total), 0)
      FROM Order o
      WHERE o.user.id = :userId
        AND (o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.DELIVERED
             OR o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED)
  """)
  BigDecimal getBuyerTotalSpent(@Param("userId") UUID userId);

  @Query("""
      SELECT COALESCE(SUM(o.discountAmount), 0)
      FROM Order o
      WHERE o.user.id = :userId
        AND o.status <> com.marketplace.ecommerce.order.valueObjects.OrderStatus.CANCELLED
  """)
  BigDecimal getBuyerTotalVoucherSaved(@Param("userId") UUID userId);

  boolean existsByShopIdAndStatusIn(UUID shopId, Collection<OrderStatus> statuses);

  @Query("""
      SELECT COUNT(o) > 0
      FROM Order o
      WHERE o.shop.id = :shopId
        AND o.status = com.marketplace.ecommerce.order.valueObjects.OrderStatus.COMPLETED
        AND (o.deliveredAt IS NULL OR o.deliveredAt > :coolingCutoff)
  """)
  boolean existsCompletedOrderWithinCoolingPeriod(@Param("shopId") UUID shopId, @Param("coolingCutoff") LocalDateTime coolingCutoff);
}

