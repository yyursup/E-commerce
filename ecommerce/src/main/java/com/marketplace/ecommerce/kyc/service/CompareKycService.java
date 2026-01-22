package com.marketplace.ecommerce.kyc.service;

import java.util.Map;
import java.util.UUID;

public interface CompareKycService {
    Map<String, Object> compare(UUID sessionId, UUID accountId);
}
