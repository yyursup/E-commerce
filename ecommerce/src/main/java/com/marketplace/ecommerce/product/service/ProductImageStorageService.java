package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.response.ImageUploadResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductImageStorageService {
    ImageUploadResponse uploadProductImage(MultipartFile file);
    List<ImageUploadResponse> uploadMultipleProductImages(MultipartFile[] files);
    ResponseEntity<Void> deleteProductImage(String imageUrl);
}
