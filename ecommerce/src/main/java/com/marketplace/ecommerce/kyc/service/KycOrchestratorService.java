package com.marketplace.ecommerce.kyc.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

public interface KycOrchestratorService {
    Map<String, Object> uploadFileAndAttach(
            UUID sessionId,
            UUID accountId,
            MultipartFile file,
            String title,
            String description
    );
}
