package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.dto.response.LivenessResponse;
import com.marketplace.ecommerce.kyc.service.FaceLivenessService;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.FaceLivenessResult;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FaceLivenessServiceImpl implements FaceLivenessService {

    private final VNPTClient vnpt;

    @Override
    public FaceLivenessResult verify(String fileHash, String clientSession) {
        LivenessResponse live = vnpt.liveness(fileHash, clientSession);

        String lv = (live != null && live.getObj() != null) ? live.getObj().getLiveness() : null;
        String msg = (live != null && live.getObj() != null) ? live.getObj().getLivenessMsg() : null;

        boolean isLive = "success".equalsIgnoreCase(lv);
        return new FaceLivenessResult(isLive, lv, msg);
    }
}
