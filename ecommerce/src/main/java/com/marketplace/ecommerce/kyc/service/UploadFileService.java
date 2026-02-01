package com.marketplace.ecommerce.kyc.service;

import org.springframework.web.multipart.MultipartFile;

public interface UploadFileService {
    String upload(MultipartFile file);
}
