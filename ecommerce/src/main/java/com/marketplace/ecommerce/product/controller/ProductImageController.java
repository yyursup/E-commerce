package com.marketplace.ecommerce.product.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.product.dto.response.ImageUploadResponse;
import com.marketplace.ecommerce.product.service.ProductImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping(version = "1", path = "/product/image")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageStorageService imageStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @CurrentUser CurrentUserInfo user
    ) {
        return ResponseEntity.ok(imageStorageService.uploadProductImage(file));
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<List<ImageUploadResponse>> uploadMultipleImages(
            @RequestParam("files") MultipartFile[] files,
            @CurrentUser CurrentUserInfo user
    ) {
        return ResponseEntity.ok(imageStorageService.uploadMultipleProductImages(files));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteImage(
            @RequestParam("imageUrl") String imageUrl,
            @CurrentUser CurrentUserInfo user
    ) {
        return imageStorageService.deleteProductImage(imageUrl);
    }
}
