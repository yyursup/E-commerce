package com.marketplace.ecommerce.kyc.service;

import com.marketplace.ecommerce.kyc.valueObjects.FaceLivenessResult;

import java.util.Map;
import java.util.UUID;

public interface FaceLivenessService {
    FaceLivenessResult verify(String fileHash, String clientSession);
}
