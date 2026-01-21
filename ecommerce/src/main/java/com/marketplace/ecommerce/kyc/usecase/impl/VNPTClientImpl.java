package com.marketplace.ecommerce.kyc.usecase.impl;

import com.marketplace.ecommerce.config.EKycConfig;
import com.marketplace.ecommerce.kyc.dto.request.*;
import com.marketplace.ecommerce.kyc.dto.response.*;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;


import java.util.Objects;

@Service
@RequiredArgsConstructor
public class VNPTClientImpl implements VNPTClient {

    private final RestClient vnptRestClient;
    private final EKycConfig cfg;

    // Lombok @RequiredArgsConstructor không cho custom init WebClient field dễ đọc,
    // nên dùng constructor explicit để build WebClient đúng baseUrl + headers.
    @Override
    public ClassifyResponse classify(String imgHash, String session) {
        ClassifyRequest req = new ClassifyRequest();
        req.setImgCard(imgHash);
        req.setClientSession(session);
        req.setToken(cfg.getTokenKey());

        ClassifyResponse res = vnptRestClient.post()
                .uri("/ai/v1/classify/id")
                .body(req)
                .retrieve()
                .body(ClassifyResponse.class);

        return Objects.requireNonNull(res, "VNPT classify returned null");
    }

    @Override
    public OcrFrontResponse ocrFront(String imgHash, int type, String session) {
        OcrFrontRequest req = new OcrFrontRequest();
        req.setImgFront(imgHash);
        req.setType(type);
        req.setClientSession(session);
        req.setToken(cfg.getTokenKey());

        OcrFrontResponse res = vnptRestClient.post()
                .uri("/ai/v1/ocr/id/front")
                .body(req)
                .retrieve()
                .body(OcrFrontResponse.class);

        return Objects.requireNonNull(res, "VNPT ocrFront returned null");
    }

    @Override
    public OcrBackResponse ocrBack(String imgHash, int type, String session) {
        OcrBackRequest req = new OcrBackRequest();
        req.setImgBack(imgHash);
        req.setType(type);
        req.setClientSession(session);
        req.setToken(cfg.getTokenKey());

        OcrBackResponse res = vnptRestClient.post()
                .uri("/ai/v1/ocr/id/back")
                .body(req)
                .retrieve()
                .body(OcrBackResponse.class);

        return Objects.requireNonNull(res, "VNPT ocrBack returned null");
    }

    @Override
    public LivenessResponse liveness(String imgHash, String session) {
        LivenessRequest req = new LivenessRequest();
        req.setImg(imgHash);
        req.setClientSession(session);
        req.setToken(cfg.getTokenKey());

        LivenessResponse res = vnptRestClient.post()
                .uri("/ai/v1/face/liveness")
                .body(req)
                .retrieve()
                .body(LivenessResponse.class);

        return Objects.requireNonNull(res, "VNPT liveness returned null");
    }

    @Override
    public CompareResponse compare(String frontHash, String faceHash, String session) {
        CompareRequest req = new CompareRequest();
        req.setImgFront(frontHash);
        req.setImgFace(faceHash);
        req.setClientSession(session);
        req.setToken(cfg.getTokenKey());

        CompareResponse res = vnptRestClient.post()
                .uri("/ai/v1/face/compare")
                .body(req)
                .retrieve()
                .body(CompareResponse.class);

        return Objects.requireNonNull(res, "VNPT compare returned null");
    }

}
