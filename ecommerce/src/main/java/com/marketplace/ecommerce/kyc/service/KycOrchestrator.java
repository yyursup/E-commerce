package com.marketplace.ecommerce.kyc.service;

import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;

import java.util.Map;
import java.util.UUID;

public interface KycOrchestrator {

    UUID start(UUID accountId);

    void attachFile(
            UUID sessionId,
            UUID accountId,
            KycDocumentType type,
            String fileHash
    );

    Map<String, Object> classify(UUID sessionId, UUID accountId, String fileHash);

    Map<String, Object> ocrFront(UUID sessionId, UUID accountId, String fileHash, int type);

    Map<String, Object> ocrBack(UUID sessionId, UUID accountId, String fileHash, int type);

    Map<String, Object> liveness(UUID sessionId, UUID accountId, String fileHash);

    Map<String, Object> compare(UUID sessionId, UUID accountId);

    EKycSession get(UUID sessionId, UUID accountId);

}
