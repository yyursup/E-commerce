package com.marketplace.ecommerce.kyc.repository;

import com.marketplace.ecommerce.kyc.entity.EKycDocument;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycDocumentRepository extends JpaRepository<EKycDocument, UUID> {
    Optional<EKycDocument> findBySessionIdAndType(
            UUID sessionId,
            KycDocumentType type
    );
}
