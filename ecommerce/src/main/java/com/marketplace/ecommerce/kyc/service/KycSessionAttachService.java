package com.marketplace.ecommerce.kyc.service;

import com.marketplace.ecommerce.kyc.valueObjects.AttachDecision;

import java.util.UUID;

public interface KycSessionAttachService {

    AttachDecision attachFile(UUID sessionId, UUID accountId, String fileHash, String classifyName);
}
