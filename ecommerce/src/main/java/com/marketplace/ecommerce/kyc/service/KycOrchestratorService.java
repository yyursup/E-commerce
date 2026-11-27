package com.marketplace.ecommerce.kyc.service;

import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

public interface KycOrchestratorService {
    Map<String, Object> uploadFileAndAttach(
            UUID sessionId,
            UUID accountId,
            MultipartFile file,
            String title,
            String description,
            KycDocumentType expectedType
    );

    default Map<String, Object> uploadFileAndAttach(
            UUID sessionId,
            UUID accountId,
            MultipartFile file,
            String title,
            String description
    ) {
        return uploadFileAndAttach(sessionId, accountId, file, title, description, null);
    }
}
