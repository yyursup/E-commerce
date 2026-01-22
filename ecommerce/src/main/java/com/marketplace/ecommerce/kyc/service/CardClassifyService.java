package com.marketplace.ecommerce.kyc.service;

import com.marketplace.ecommerce.kyc.valueObjects.ClassifyResult;

public interface CardClassifyService {

    ClassifyResult classify(String fileHash, String clientSession);
}
