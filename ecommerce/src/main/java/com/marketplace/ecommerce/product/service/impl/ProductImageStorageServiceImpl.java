package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.config.MinIOConfig;
import com.marketplace.ecommerce.product.dto.response.ImageUploadResponse;
import com.marketplace.ecommerce.product.service.ProductImageStorageService;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductImageStorageServiceImpl implements ProductImageStorageService {

    private final MinioClient minioClient;
    private final MinIOConfig minIOConfig;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"};
    private static final String PRODUCT_IMAGES_FOLDER = "products/";

    @Override
    public ImageUploadResponse uploadProductImage(MultipartFile file) {
        try {
            // 1. Validate file
            validateFile(file);

            // 2. Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String uniqueFileName = PRODUCT_IMAGES_FOLDER + UUID.randomUUID() + extension;

            // 3. Upload to MinIO
            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                    PutObjectArgs.builder()
                        .bucket(minIOConfig.getBucketName())
                        .object(uniqueFileName)
                        .stream(inputStream, file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
                );
            }

            // 4. Return public URL
            String imageUrl = buildPublicUrl(uniqueFileName);

            return ImageUploadResponse.builder()
                    .imageUrl(imageUrl)
                    .fileName(originalFilename)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .build();

        } catch (Exception e) {
            throw new CustomException("Failed to upload image: " + e.getMessage());
        }
    }

    @Override
    public List<ImageUploadResponse> uploadMultipleProductImages(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new CustomException("No files provided");
        }

        List<ImageUploadResponse> uploadResponses = Arrays.stream(files)
                .map(this::uploadProductImage)
                .collect(Collectors.toList());

        return uploadResponses;
    }

    @Override
    public ResponseEntity<Void> deleteProductImage(String imageUrl) {
        try {
            // Extract object name from URL
            String objectName = extractObjectNameFromUrl(imageUrl);
            
            if (objectName == null || objectName.isEmpty()) {
                return ResponseEntity.noContent().build();
            }

            // Delete from MinIO
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(minIOConfig.getBucketName())
                    .object(objectName)
                    .build()
            );

            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            throw new CustomException("Failed to delete image: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException("File size exceeds maximum allowed size of 5MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new CustomException("File name is null");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        boolean isValidExtension = false;
        for (String allowedExt : ALLOWED_EXTENSIONS) {
            if (extension.equals(allowedExt)) {
                isValidExtension = true;
                break;
            }
        }

        if (!isValidExtension) {
            throw new CustomException("File type not allowed. Allowed types: jpg, jpeg, png, webp");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }

    private String buildPublicUrl(String objectName) {
        // MinIO public URL format: http://minio-url/bucket-name/object-name
        String baseUrl = minIOConfig.getUrl();
        // Remove trailing slash if present
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return String.format("%s/%s/%s", baseUrl, minIOConfig.getBucketName(), objectName);
    }

    private String extractObjectNameFromUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return null;
        }
        
        // Extract object name from URL like: http://localhost:9000/bucket-name/products/uuid.jpg
        try {
            String bucketName = minIOConfig.getBucketName();
            int bucketIndex = imageUrl.indexOf(bucketName);
            if (bucketIndex == -1) {
                return null;
            }
            
            String objectName = imageUrl.substring(bucketIndex + bucketName.length() + 1);
            return objectName;
        } catch (Exception e) {
            return null;
        }
    }
}
