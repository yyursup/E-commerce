package com.marketplace.ecommerce.kyc.usecase;

import com.marketplace.ecommerce.kyc.dto.response.*;
import org.springframework.web.multipart.MultipartFile;

public interface VNPTClient {

    UploadResponse addFile(MultipartFile file);

    CardLivenessResponse cardLiveness(String imgHash, String session);

    ClassifyResponse classify(String imgHash, String session);

    OcrFrontResponse ocrFront(String imgHash, int type, String session);

    OcrBackResponse ocrBack(String imgHash, int type, String session);

    LivenessResponse liveness(String imgHash, String session);

    CompareResponse compare(String frontHash, String faceHash, String session);
}
