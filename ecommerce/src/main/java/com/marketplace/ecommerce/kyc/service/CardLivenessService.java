package com.marketplace.ecommerce.kyc.service;

import com.marketplace.ecommerce.kyc.dto.response.CardLivenessResponse;
import com.marketplace.ecommerce.kyc.valueObjects.CardLivenessResult;

public interface CardLivenessService {
    CardLivenessResult verify(String fileHash, String clientSession);
}
