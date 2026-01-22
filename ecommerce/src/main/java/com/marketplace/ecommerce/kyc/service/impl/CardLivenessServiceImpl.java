package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.dto.response.CardLivenessResponse;
import com.marketplace.ecommerce.kyc.service.CardLivenessService;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.CardLivenessResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CardLivenessServiceImpl implements CardLivenessService {
    private final VNPTClient vnpt;

    @Override
    public CardLivenessResult verify(String fileHash, String clientSession) {
        CardLivenessResponse live = vnpt.cardLiveness(fileHash, clientSession);

        String lv = (live != null && live.getObject() != null) ? live.getObject().getLiveness() : null;
        String msg = (live != null && live.getObject() != null) ? live.getObject().getLivenessMsg() : null;

        boolean isReal = "success".equalsIgnoreCase(lv);
        return new CardLivenessResult(isReal, lv, msg);
    }
}
