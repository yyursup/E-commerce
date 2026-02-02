package com.marketplace.ecommerce.payment.repository;

import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow, UUID> {
    Optional<Escrow> findByOrderId(UUID orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Escrow e where e.order.id = :orderId")
    Optional<Escrow> findByOrderIdForUpdate(@Param("orderId") UUID orderId);

    @Query("""
                select e
                from Escrow e
                where (:status is null or e.status = :status)
                order by e.createdAt desc
            """)
    Page<Escrow> adminList(@Param("status") EscrowStatus status, Pageable pageable);
}
