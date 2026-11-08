package com.marketplace.ecommerce.wallet.repository;

import com.marketplace.ecommerce.wallet.entity.WithdrawalRequest;
import com.marketplace.ecommerce.wallet.valueObjects.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, UUID> {

    Page<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<WithdrawalRequest> findByStatusOrderByCreatedAtDesc(WithdrawalStatus status, Pageable pageable);

    Page<WithdrawalRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<WithdrawalRequest> findByTxRef(String txRef);
}

