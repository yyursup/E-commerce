package com.marketplace.ecommerce.kyc.repository;

import com.marketplace.ecommerce.kyc.entity.EKycSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycSessionRepository extends JpaRepository<EKycSession, UUID> {

    Optional<EKycSession> findByIdAndAccountId(
            UUID id,
            UUID accountId);
}
