package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.dto.response.ClassifyResponse;
import com.marketplace.ecommerce.kyc.service.CardClassifyService;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.ClassifyResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CardClassifyServiceImpl implements CardClassifyService {
    private final VNPTClient vnpt;

    @Override
    public ClassifyResult classify(String fileHash, String clientSession) {
        ClassifyResponse cls = vnpt.classify(fileHash, clientSession);

        String name = (cls != null && cls.getObj() != null) ? cls.getObj().getName() : null;
        Integer type = (cls != null && cls.getObj() != null) ? cls.getObj().getType() : null;
        Double conf = (cls != null && cls.getObj() != null) ? cls.getObj().getConfidence() : null;

        return new ClassifyResult(name, type, conf);
    }
}
