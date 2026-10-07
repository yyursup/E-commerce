package com.marketplace.ecommerce.order.repository;

import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderReturnRepository extends JpaRepository<OrderReturn, UUID> {

    Optional<OrderReturn> findByOrderId(UUID orderId);

    List<OrderReturn> findByOrderIdIn(List<UUID> orderIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM OrderReturn r WHERE r.id = :id")
    Optional<OrderReturn> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM OrderReturn r WHERE r.order.id = :orderId")
    Optional<OrderReturn> findByOrderIdForUpdate(@Param("orderId") UUID orderId);

    @Query("SELECT r FROM OrderReturn r WHERE r.status = :status AND r.buyerShipmentDeadline < :now")
    List<OrderReturn> findExpiredBuyerShipments(@Param("status") ReturnStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT r FROM OrderReturn r WHERE r.status = :status AND r.sellerInspectionDeadline IS NOT NULL AND r.sellerInspectionDeadline < :now")
    List<OrderReturn> findExpiredSellerInspections(@Param("status") ReturnStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(r) > 0 FROM OrderReturn r WHERE r.order.shop.id = :shopId AND r.status IN :statuses")
    boolean existsByOrderShopIdAndStatusIn(@Param("shopId") UUID shopId, @Param("statuses") java.util.Collection<ReturnStatus> statuses);
}
