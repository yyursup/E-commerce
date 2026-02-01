package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.dto.response.UploadResponse;
import com.marketplace.ecommerce.kyc.service.UploadFileService;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UploadFileServiceImpl implements UploadFileService {
    private final VNPTClient vnpt;

    @Override
    public String upload(MultipartFile file) {
        UploadResponse up = vnpt.addFile(file);
        String hash = up != null && up.getObject() != null ? up.getObject().getHash() : null;
        if (hash == null || hash.isBlank()) {
            throw new IllegalStateException("VNPT addFile returned empty hash");
        }
        return hash;
    }
}
