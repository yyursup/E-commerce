package com.marketplace.ecommerce.voucher.repository;

import com.marketplace.ecommerce.voucher.entity.UserVoucher;
import com.marketplace.ecommerce.voucher.valueObjects.UserVoucherStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, UUID> {

    List<UserVoucher> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<UserVoucher> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, UserVoucherStatus status);

    Optional<UserVoucher> findByUserIdAndVoucherIdAndStatus(UUID userId, UUID voucherId, UserVoucherStatus status);

    boolean existsByUserIdAndVoucherIdAndStatus(UUID userId, UUID voucherId, UserVoucherStatus status);

    long countByUserIdAndVoucherIdAndStatus(UUID userId, UUID voucherId, UserVoucherStatus status);

    @Query("SELECT uv FROM UserVoucher uv " +
            "JOIN FETCH uv.voucher v " +
            "LEFT JOIN FETCH v.shop " +
            "WHERE uv.user.id = :userId AND uv.status = :status")
    List<UserVoucher> findMyVouchersWithDetails(@Param("userId") UUID userId, @Param("status") UserVoucherStatus status);

    List<UserVoucher> findByOrderId(UUID orderId);

    @Query("SELECT uv.voucher.id, COUNT(uv) FROM UserVoucher uv " +
            "WHERE uv.user.id = :userId AND uv.status = com.marketplace.ecommerce.voucher.valueObjects.UserVoucherStatus.USED " +
            "GROUP BY uv.voucher.id")
    List<Object[]> countUsedVouchersByUserId(@Param("userId") UUID userId);
}
